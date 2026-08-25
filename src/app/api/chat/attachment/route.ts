import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { postCustomerAttachment } from "@/lib/chat";
import { requireCustomerSession } from "@/lib/customer-auth";
import { isSameOrigin } from "@/lib/csrf";
import { limitChatMessage } from "@/lib/ratelimit";

export const runtime = "nodejs";

// /api/chat/upload가 반환한 경로만 허용 — 임의의 외부 URL을 그대로 저장하지 않습니다.
const schema = z.object({
  conversationId: z.string().min(1),
  url: z.string().regex(/^\/uploads\/chat\/[a-zA-Z0-9_-]+\.(jpg|png|webp|gif|pdf|zip)$/),
  name: z.string().trim().min(1).max(200),
  mime: z.string().trim().min(1).max(100),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireCustomerSession();
  if (!session?.customerId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const allowed = await limitChatMessage(session.customerId);
  if (!allowed) {
    return NextResponse.json({ error: "메시지를 너무 자주 보내고 있어요." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  let message;
  try {
    message = await postCustomerAttachment({
      customerId: session.customerId,
      ...parsed.data,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CONVERSATION_NOT_FOUND") {
      return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true, message });
}
