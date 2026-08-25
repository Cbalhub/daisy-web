import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { postCustomerMessage } from "@/lib/chat";
import { requireCustomerSession } from "@/lib/customer-auth";
import { limitChatMessage } from "@/lib/ratelimit";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

const postSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireCustomerSession();
  if (!session?.customerId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // 로그인된 사용자이므로 IP 대신 계정(customerId)으로 제한합니다 — 같은 IP를
  // 공유하는 다른 고객이 함께 차단되거나, IP를 바꿔가며 우회하는 것을 방지합니다.
  const allowed = await limitChatMessage(session.customerId);
  if (!allowed) {
    return NextResponse.json({ error: "메시지를 너무 자주 보내고 있어요." }, { status: 429 });
  }

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  let message;
  try {
    message = await postCustomerMessage({
      customerId: session.customerId,
      conversationId: parsed.data.conversationId,
      body: parsed.data.body,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CONVERSATION_NOT_FOUND") {
      return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true, message });
}

// 메시지 수신은 /api/chat/stream(SSE)이 담당합니다 — 이 라우트는 전송(POST) 전용입니다.
