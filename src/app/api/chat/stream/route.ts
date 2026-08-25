import { NextRequest } from "next/server";
import { requireCustomerSession } from "@/lib/customer-auth";
import { getCustomerConversation } from "@/lib/chat";

export const runtime = "nodejs";

const CHECK_INTERVAL_MS = 1200;
const HEARTBEAT_EVERY_MS = 20000;

/**
 * Server-Sent Events 스트림입니다. 클라이언트가 4초마다 다시 요청하는 폴링 대신,
 * 연결을 열어두고 새 메시지가 생기는 즉시(최대 CHECK_INTERVAL_MS 지연) 밀어줍니다.
 * 실제로는 서버 쪽에서 짧은 주기로 DB를 확인하는 방식이지만, 클라이언트 입장에서는
 * 재요청 없이 실시간으로 느껴집니다. Vercel 등 서버리스 환경에서도 별도의
 * WebSocket 서버 없이 Next.js Route Handler만으로 동작합니다.
 */
export async function GET(req: NextRequest) {
  const session = await requireCustomerSession();
  if (!session?.customerId) {
    return new Response("unauthorized", { status: 401 });
  }
  const customerId = session.customerId;

  const conversationIdParam = req.nextUrl.searchParams.get("conversationId");
  if (!conversationIdParam) {
    return new Response("conversationId required", { status: 400 });
  }
  const conversationId: string = conversationIdParam;

  let closed = false;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastCreatedAt: Date | undefined;

      function send(event: string, data: unknown) {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      async function check() {
        if (closed) return;
        try {
          const result = await getCustomerConversation(customerId, conversationId, lastCreatedAt);
          if (result.messages.length > 0) {
            lastCreatedAt = new Date(result.messages.at(-1)!.createdAt);
            send("messages", result.messages);
          }
        } catch {
          // DB 순간 오류는 다음 주기에 다시 시도 — 연결 자체를 끊지 않습니다.
        }
      }

      // 최초 접속 시 지금까지의 메시지를 한 번에 보내줍니다.
      check();
      const checkInterval = setInterval(check, CHECK_INTERVAL_MS);
      const heartbeatInterval = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, HEARTBEAT_EVERY_MS);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(checkInterval);
        clearInterval(heartbeatInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
