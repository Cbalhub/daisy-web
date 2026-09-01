import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validation/review";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { revalidateReviews } from "@/lib/revalidate";

export const runtime = "nodejs";

export async function PATCH(
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

  const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const { id } = await params;
  const { published, role, rating, ...rest } = parsed.data;
  const publishedAt = await resolvePublishedAt(id, published);

  const review = await prisma.review.update({
    where: { id },
    data: { ...rest, role: role || null, rating: rating ?? null, publishedAt },
  });

  revalidateReviews();
  return NextResponse.json({ ok: true, review });
}

// 이미 게시된 후기를 다시 저장할 때 publishedAt(최초 게시일)이 매번 지금 시각으로
// 갱신되지 않도록, 기존 값이 있으면 유지하고 새로 게시되는 경우에만 현재 시각을 채웁니다.
async function resolvePublishedAt(id: string, published: boolean) {
  if (!published) return null;
  const existing = await prisma.review.findUnique({
    where: { id },
    select: { publishedAt: true },
  });
  return existing?.publishedAt ?? new Date();
}

export async function DELETE(
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

  const { id } = await params;
  await prisma.review.delete({ where: { id } });
  revalidateReviews();
  return NextResponse.json({ ok: true });
}
