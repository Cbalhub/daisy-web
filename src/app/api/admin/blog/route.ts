import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { blogGenerateSchema } from "@/lib/validation/blog";
import { generateBlogDraft, BlogDraftError } from "@/lib/blog-draft";

export const runtime = "nodejs";
// 모델 응답이 길어질 수 있어 넉넉히.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = blogGenerateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  let generated;
  try {
    generated = await generateBlogDraft(parsed.data);
  } catch (err) {
    if (err instanceof BlogDraftError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[api/admin/blog] 생성 실패:", err);
    return NextResponse.json({ error: "초안 생성에 실패했습니다." }, { status: 502 });
  }

  const draft = await prisma.blogDraft.create({
    data: {
      topic: parsed.data.topic,
      keywords: parsed.data.keywords,
      platform: parsed.data.platform,
      tone: parsed.data.tone,
      title: generated.title,
      body: generated.body,
      metaDescription: generated.metaDescription,
      tags: generated.tags,
      model: generated.model,
      createdById: session.adminId,
    },
  });

  void prisma.auditLog
    .create({
      data: {
        adminId: session.adminId,
        action: "blog.draft_generate",
        targetType: "BlogDraft",
        targetId: draft.id,
        metadata: { topic: draft.topic, model: draft.model },
      },
    })
    .catch((e) => console.error("[api/admin/blog] audit log 실패:", e));

  return NextResponse.json({ ok: true, draft });
}
