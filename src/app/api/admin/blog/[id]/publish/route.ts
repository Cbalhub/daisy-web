import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

const schema = z.object({
  platform: z.enum(["NAVER", "TISTORY"]),
  action: z.enum(["queue", "unqueue", "reset"]),
});

// 대표님이 편집 화면에서 "네이버 발행" 등을 누르면 해당 초안을 발행 대기열에
// 올립니다(state QUEUED). 실제 게시는 로컬 퍼블리셔가 담당합니다.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const { platform, action } = parsed.data;

  const draft = await prisma.blogDraft.findUnique({ where: { id } });
  if (!draft) return NextResponse.json({ error: "초안을 찾을 수 없습니다." }, { status: 404 });

  const stateField = platform === "NAVER" ? "naverState" : "tistoryState";
  const errorField = platform === "NAVER" ? "naverError" : "tistoryError";
  const current = draft[stateField];

  if (action === "queue") {
    if (!draft.title.trim() || !draft.body.trim()) {
      return NextResponse.json({ error: "제목·본문이 있어야 발행할 수 있어요." }, { status: 400 });
    }
    if (current === "PUBLISHING") {
      return NextResponse.json({ error: "이미 발행 중입니다." }, { status: 409 });
    }
    const data: Prisma.BlogDraftUpdateInput = { [stateField]: "QUEUED", [errorField]: "" };
    await prisma.blogDraft.update({ where: { id }, data });
  } else if (action === "unqueue") {
    if (current !== "QUEUED") {
      return NextResponse.json({ error: "대기열 상태가 아닙니다." }, { status: 409 });
    }
    await prisma.blogDraft.update({ where: { id }, data: { [stateField]: "IDLE" } });
  } else {
    // reset — 실패 상태를 되돌림
    await prisma.blogDraft.update({
      where: { id },
      data: { [stateField]: "IDLE", [errorField]: "" },
    });
  }

  const updated = await prisma.blogDraft.findUnique({ where: { id } });
  return NextResponse.json({ ok: true, draft: updated });
}
