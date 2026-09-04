import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { postAdminAttachments } from "@/lib/chat";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { CHAT_UPLOAD_URL_RE } from "@/lib/upload";

export const runtime = "nodejs";

const item = z.object({
  url: z.string().regex(CHAT_UPLOAD_URL_RE),
  name: z.string().trim().min(1).max(200),
  mime: z.string().trim().min(1).max(100),
});
const schema = z.object({
  url: z.string().regex(CHAT_UPLOAD_URL_RE).optional(),
  name: z.string().trim().min(1).max(200).optional(),
  mime: z.string().trim().min(1).max(100).optional(),
  items: z.array(item).min(1).max(10).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  const { id: conversationId } = await params;
  const messages = await postAdminAttachments({ conversationId, items });

  return NextResponse.json({ ok: true, messages, message: messages[0] });
}
