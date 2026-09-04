import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPlainText, toMarkdown } from "@/lib/blog-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 로컬 퍼블리셔가 이 엔드포인트를 폴링합니다. PUBLISHER_SECRET Bearer 필요.
// QUEUED 초안을 반환하면서 원자적으로 PUBLISHING 으로 바꿔 중복 발행을 막습니다.
export async function GET(req: NextRequest) {
  const secret = process.env.PUBLISHER_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "publisher disabled" }, { status: 404 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const queued = await prisma.blogDraft.findMany({
    where: { OR: [{ naverState: "QUEUED" }, { tistoryState: "QUEUED" }] },
    orderBy: { updatedAt: "asc" },
    take: 10,
  });

  const jobs: {
    id: string;
    platform: "NAVER" | "TISTORY";
    title: string;
    bodyPlain: string;
    bodyMarkdown: string;
    tags: string[];
  }[] = [];

  for (const d of queued) {
    if (d.naverState === "QUEUED") {
      const { count } = await prisma.blogDraft.updateMany({
        where: { id: d.id, naverState: "QUEUED" },
        data: { naverState: "PUBLISHING" },
      });
      if (count > 0) {
        jobs.push({
          id: d.id,
          platform: "NAVER",
          title: d.title,
          bodyPlain: toPlainText(d.body),
          bodyMarkdown: toMarkdown(d.body),
          tags: d.tags,
        });
      }
    }
    if (d.tistoryState === "QUEUED") {
      const { count } = await prisma.blogDraft.updateMany({
        where: { id: d.id, tistoryState: "QUEUED" },
        data: { tistoryState: "PUBLISHING" },
      });
      if (count > 0) {
        jobs.push({
          id: d.id,
          platform: "TISTORY",
          title: d.title,
          bodyPlain: toPlainText(d.body),
          bodyMarkdown: toMarkdown(d.body),
          tags: d.tags,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, jobs });
}
