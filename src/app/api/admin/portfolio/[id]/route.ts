import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { portfolioSchema } from "@/lib/validation/portfolio";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { revalidatePortfolio } from "@/lib/revalidate";
import { deleteUploadByUrl } from "@/lib/upload";

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

  const parsed = portfolioSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const { id } = await params;
  const { published, body, ...rest } = parsed.data;
  const publishedAt = await resolvePublishedAt(id, published);

  const before = await prisma.portfolioItem.findUnique({
    where: { id },
    select: { images: true },
  });

  try {
    const item = await prisma.portfolioItem.update({
      where: { id },
      data: { ...rest, body: body || "", publishedAt },
    });
    // 이번 저장에서 빠진 이미지 파일은 디스크에서도 지웁니다(안 그러면 교체할 때마다
    // 옛 파일이 public/uploads 에 영영 쌓입니다).
    const removed = (before?.images ?? []).filter((u) => !item.images.includes(u));
    await Promise.allSettled(removed.map(deleteUploadByUrl));
    revalidatePortfolio();
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "이미 사용 중인 슬러그입니다." }, { status: 409 });
    }
    throw err;
  }
}

// 이미 게시된 항목을 다시 저장할 때 publishedAt(최초 게시일)이 매번 지금 시각으로
// 갱신되지 않도록, 기존 값이 있으면 유지하고 새로 게시되는 경우에만 현재 시각을 채웁니다.
async function resolvePublishedAt(id: string, published: boolean) {
  if (!published) return null;
  const existing = await prisma.portfolioItem.findUnique({
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
  const removed = await prisma.portfolioItem
    .findUnique({ where: { id }, select: { images: true } })
    .then((p) => p?.images ?? []);
  await prisma.portfolioItem.delete({ where: { id } });
  await Promise.allSettled(removed.map(deleteUploadByUrl));
  revalidatePortfolio();
  return NextResponse.json({ ok: true });
}
