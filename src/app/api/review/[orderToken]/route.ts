import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerReviewSchema } from "@/lib/validation/review";
import { isSameOrigin } from "@/lib/csrf";
import { limitReviewSubmission } from "@/lib/ratelimit";

export const runtime = "nodejs";

// 무통장입금 흐름과 같은 신뢰 모델입니다 — orderToken 자체가 추측 불가능한
// 값이라, 이 링크를 아는 사람(=프로젝트를 실제로 진행한 고객)만 접근 가능하면
// 충분하고 별도 로그인 확인은 두지 않습니다.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderToken: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const { orderToken } = await params;

  const allowed = await limitReviewSubmission(`review:${orderToken}`);
  if (!allowed) {
    return NextResponse.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const parsed = customerReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { orderToken },
    include: { review: { select: { id: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }
  if (order.status !== "PAID" || order.progressStage !== "DELIVERED") {
    return NextResponse.json(
      { error: "아직 후기를 남길 수 없는 프로젝트예요." },
      { status: 400 }
    );
  }
  if (order.review) {
    return NextResponse.json({ error: "이미 이 프로젝트에 후기를 남기셨어요." }, { status: 400 });
  }

  const { company, role, quote, rating } = parsed.data;

  try {
    await prisma.review.create({
      data: {
        company,
        role: role || null,
        quote,
        rating,
        orderId: order.id,
        // 관리자가 확인 후 직접 게시합니다 — 제출 즉시 공개되지 않습니다.
        publishedAt: null,
      },
    });
  } catch {
    // orderId @unique 제약 위반(동시에 두 번 제출) 등 — 이미 처리됐다고 안내
    return NextResponse.json({ error: "이미 이 프로젝트에 후기를 남기셨어요." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
