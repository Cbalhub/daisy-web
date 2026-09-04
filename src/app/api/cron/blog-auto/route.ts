import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pickBlogTopic } from "@/lib/blog-topic";
import { generateBlogDraft, BlogDraftError } from "@/lib/blog-draft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// 매일 1회 호출 — 주제 선정 → 초안 생성 → 티스토리 발행 대기열 등록.
// 실제 게시는 로컬 퍼블리셔(tools/blog-publisher)가 QUEUED 를 집어서 처리합니다.
// crontab 예: 0 0 * * *  curl -sf -H "Authorization: Bearer $CRON_SECRET" https://movd.co.kr/api/cron/blog-auto
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  // 하루에 한 번만. 20시간 안에 자동 생성분이 있으면 건너뜀(수동 생성은 카운트 안 함).
  const since = new Date(Date.now() - 20 * 60 * 60 * 1000);
  const already = await prisma.blogDraft.findFirst({
    where: { createdAt: { gte: since }, model: { contains: "auto:" } },
    select: { id: true },
  });
  if (already) {
    return NextResponse.json({ ok: true, skipped: "이미 오늘 자동 초안이 있습니다." });
  }

  const recent = await prisma.blogDraft.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { title: true, topic: true },
  });
  const recentTitles = recent.map((r) => r.title || r.topic).filter(Boolean);

  try {
    const picked = await pickBlogTopic(recentTitles);
    const generated = await generateBlogDraft({
      topic: picked.topic,
      keywords: picked.keywords,
      platform: "TISTORY",
      tone: picked.tone,
    });

    const draft = await prisma.blogDraft.create({
      data: {
        topic: picked.topic,
        keywords: picked.keywords,
        platform: "TISTORY",
        tone: picked.tone,
        title: generated.title,
        body: generated.body,
        metaDescription: generated.metaDescription,
        tags: generated.tags,
        model: `auto:${generated.model}`,
        tistoryState: "QUEUED",
      },
    });

    void prisma.auditLog
      .create({
        data: {
          action: "blog.auto_generate",
          targetType: "BlogDraft",
          targetId: draft.id,
          metadata: { topic: draft.topic, tone: picked.tone },
        },
      })
      .catch(() => {});

    return NextResponse.json({
      ok: true,
      draft: { id: draft.id, title: draft.title, topic: draft.topic },
    });
  } catch (err) {
    const msg = err instanceof BlogDraftError ? err.message : "자동 초안 생성 실패";
    console.error("[cron/blog-auto]", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
