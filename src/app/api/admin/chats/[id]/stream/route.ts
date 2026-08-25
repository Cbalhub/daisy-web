import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getAdminConversationMessages } from "@/lib/chat";
import { markAdminActive } from "@/lib/adminPresence";

export const runtime = "nodejs";

const CHECK_INTERVAL_MS = 1200;
const HEARTBEAT_EVERY_MS = 20000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) {
    return new Response("unauthorized", { status: 401 });
  }
  const { id: conversationId } = await params;

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
        markAdminActive();
        try {
          const messages = await getAdminConversationMessages(conversationId, lastCreatedAt);
          if (messages.length > 0) {
            lastCreatedAt = messages.at(-1)!.createdAt;
            send("messages", messages);
          }
        } catch {
          // DB 순간 오류는 다음 주기에 다시 시도 — 연결 자체를 끊지 않습니다.
        }
      }

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
