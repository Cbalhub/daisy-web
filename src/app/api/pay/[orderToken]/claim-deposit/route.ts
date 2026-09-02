import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { postDepositClaimNotice, getOrCreateDefaultConversation } from "@/lib/chat";
import { isSameOrigin } from "@/lib/csrf";
import { limitPaymentAttempt } from "@/lib/ratelimit";
import { sendSlackText } from "@/lib/slack";

export const runtime = "nodejs";

const bodySchema = z.object({
  depositorName: z.string().trim().min(1).max(40),
});

// 무통장입금 전용 흐름: 고객이 직접 계좌이체한 뒤 이 버튼을 눌러 "입금했어요"라고
// 알립니다. 실제 입금 확인·결제완료 전환은 관리자가 통장 내역을 보고 수동으로
// 처리합니다 — orderToken 자체가 추측 불가능한 값이라 별도 로그인 확인 없이도
// 안전하지만, 남발을 막기 위해 rate limit은 걸어둡니다.
export async function POST(req: NextRequest, { params }: { params: Promise<{ orderToken: string }> }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const { orderToken } = await params;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "입금자명을 입력해 주세요." }, { status: 400 });
  }
  const { depositorName } = parsed.data;

  const allowed = await limitPaymentAttempt(`claim:${orderToken}`);
  if (!allowed) {
    return NextResponse.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const order = await prisma.order.findUnique({ where: { orderToken } });
  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }
  if (order.status !== "DRAFT" && order.status !== "PENDING") {
    return NextResponse.json({ error: "이미 처리된 주문입니다." }, { status: 400 });
  }

  const updated = await prisma.order.updateMany({
    where: { id: order.id, status: order.status },
    data: { status: "PAYMENT_CLAIMED", depositorName },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "이미 처리된 주문입니다." }, { status: 400 });
  }

  if (order.customerId) {
    const conversationId =
      order.conversationId ?? (await getOrCreateDefaultConversation(order.customerId)).id;
    await postDepositClaimNotice({
      customerId: order.customerId,
      conversationId,
      body: `"${order.title}" 건 ₩${order.amount.toLocaleString("ko-KR")} 입금했어요 (입금자명: ${depositorName}). 확인 부탁드려요.`,
    }).catch((err) => console.error("deposit claim notice failed", err));
  }

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  await sendSlackText(
    `💰 입금했다고 알려왔어요 — ${order.title}\n₩${order.amount.toLocaleString("ko-KR")} · 입금자명 ${depositorName}`,
    {
      url: `${siteUrl}/admin/orders/${order.id}`,
      urlLabel: "입금 확인하기",
      webhook: process.env.SLACK_WEBHOOK_URL_PAYMENT || undefined,
      username: "MOVD 결제",
      iconEmoji: ":moneybag:",
    }
  );

  return NextResponse.json({ ok: true });
}
