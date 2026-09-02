import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { blogUpdateSchema } from "@/lib/validation/blog";
import { generateBlogDraft, BlogDraftError } from "@/lib/blog-draft";

export const runtime = "nodejs";
export const maxDuration = 120;

async function guard(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return { error: NextResponse.json({ error: "invalid origin" }, { status: 403 }) };
  }
  const session = await requireAdminSession();
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const { id } = await params;

  const parsed = blogUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const draft = await prisma.blogDraft
    .update({ where: { id }, data: parsed.data })
    .catch(() => null);
  if (!draft) return NextResponse.json({ error: "초안을 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json({ ok: true, draft });
}

// ?action=regenerate — 저장된 주제·키워드로 본문만 새로 생성해 덮어씁니다.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const { id } = await params;

  if (new URL(req.url).searchParams.get("action") !== "regenerate") {
    return NextResponse.json({ error: "알 수 없는 동작입니다." }, { status: 400 });
  }

  const existing = await prisma.blogDraft.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "초안을 찾을 수 없습니다." }, { status: 404 });

  let generated;
  try {
    generated = await generateBlogDraft({
      topic: existing.topic,
      keywords: existing.keywords,
      platform: existing.platform,
      tone: existing.tone,
    });
  } catch (err) {
    if (err instanceof BlogDraftError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[api/admin/blog regenerate] 실패:", err);
    return NextResponse.json({ error: "초안 재생성에 실패했습니다." }, { status: 502 });
  }

  const draft = await prisma.blogDraft.update({
    where: { id },
    data: {
      title: generated.title,
      body: generated.body,
      metaDescription: generated.metaDescription,
      tags: generated.tags,
      model: generated.model,
    },
  });
  return NextResponse.json({ ok: true, draft });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const { id } = await params;

  await prisma.blogDraft.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
