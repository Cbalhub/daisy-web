import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { postAdminReply } from "@/lib/chat";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

const postSchema = z.object({ body: z.string().trim().min(1).max(2000) });

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

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const { id } = await params;
  const message = await postAdminReply({ conversationId: id, body: parsed.data.body });

  return NextResponse.json({ ok: true, message });
}

// 메시지 수신은 /api/admin/chats/[id]/stream(SSE)이 담당합니다 — 이 라우트는 전송(POST) 전용입니다.
