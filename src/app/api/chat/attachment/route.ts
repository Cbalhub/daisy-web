import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { postCustomerAttachments } from "@/lib/chat";
import { requireCustomerSession } from "@/lib/customer-auth";
import { isSameOrigin } from "@/lib/csrf";
import { limitChatMessage } from "@/lib/ratelimit";
import { CHAT_UPLOAD_URL_RE } from "@/lib/upload";

export const runtime = "nodejs";

// /api/chat/upload가 반환한 경로만 허용 — 임의의 외부 URL을 그대로 저장하지 않습니다.
const item = z.object({
  url: z.string().regex(CHAT_UPLOAD_URL_RE),
  name: z.string().trim().min(1).max(200),
  mime: z.string().trim().min(1).max(100),
});
// 단일(url/name/mime) 또는 여러 장(items[]) 둘 다 허용.
const schema = z.object({
  conversationId: z.string().min(1),
  url: z.string().regex(CHAT_UPLOAD_URL_RE).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  mime: z.string().trim().min(1).max(100).optional(),
  items: z.array(item).min(1).max(10).optional(),
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

  const items =
    parsed.data.items ??
    (parsed.data.url && parsed.data.name && parsed.data.mime
      ? [{ url: parsed.data.url, name: parsed.data.name, mime: parsed.data.mime }]
      : []);
  if (items.length === 0) {
    return NextResponse.json({ error: "첨부할 파일이 없습니다." }, { status: 400 });
  }

  let messages;
  try {
    messages = await postCustomerAttachments({
      customerId: session.customerId,
      conversationId: parsed.data.conversationId,
      items,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CONVERSATION_NOT_FOUND") {
      return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true, messages, message: messages[0] });
}
