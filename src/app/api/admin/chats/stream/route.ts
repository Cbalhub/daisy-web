import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const CHECK_INTERVAL_MS = 3000;
const HEARTBEAT_EVERY_MS = 20000;

// 채팅 목록/대시보드처럼 특정 대화방을 열지 않은 화면을 위한 스트림입니다.
// 개별 대화방 스트림([id]/stream)과 달리 메시지 내용을 직접 내려보내지
// 않고, "뭔가 바뀌었다"는 신호만 보냅니다 — 받는 쪽(AdminLivePoller)이
// router.refresh()로 현재 라우트의 서버 컴포넌트를 다시 가져오면 되므로,
// 목록 페이지를 클라이언트 상태로 새로 짤 필요가 없습니다.
export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return new Response("unauthorized", { status: 401 });
  }

  let closed = false;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastCheckedAt = new Date();

      function send(event: string, data: unknown) {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      async function check() {
        if (closed) return;
        const checkedAt = new Date();
        try {
          const changed = await prisma.chatMessage.count({
            where: {
              OR: [
                { createdAt: { gt: lastCheckedAt } },
                { updatedAt: { gt: lastCheckedAt } },
              ],
            },
          });
          lastCheckedAt = checkedAt;
          if (changed > 0) send("update", { changed });
        } catch {
          // DB 순간 오류는 다음 주기에 다시 시도 — 연결 자체를 끊지 않습니다.
        }
      }

      // 아무 변화가 없으면 다음 하트비트(20초)까지 아무 바이트도 안 나가서,
      // 응답 헤더 자체가 첫 청크가 나갈 때까지 지연될 수 있습니다. 연결하자마자
      // 최소 한 바이트는 바로 흘려보내 헤더가 즉시 도착하게 합니다.
      controller.enqueue(encoder.encode(`: connected\n\n`));

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
