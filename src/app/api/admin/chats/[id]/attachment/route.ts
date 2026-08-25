import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { postAdminAttachment } from "@/lib/chat";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

const schema = z.object({
  url: z.string().regex(/^\/uploads\/chat\/[a-zA-Z0-9_-]+\.(jpg|png|webp|gif|pdf|zip)$/),
  name: z.string().trim().min(1).max(200),
  mime: z.string().trim().min(1).max(100),
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

  const { id: conversationId } = await params;
  const message = await postAdminAttachment({ conversationId, ...parsed.data });

  return NextResponse.json({ ok: true, message });
}
