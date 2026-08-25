import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/payment-service";
import { postPaymentRequestMessage } from "@/lib/chat";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  amount: z.number().int().positive().max(500_000_000),
  customerName: z.string().trim().max(100).optional(),
  businessRegNo: z.string().trim().max(30).optional(),
  // 각 품목 가격은 대표님이 직접 입력한 값을 그대로 씁니다(자동 분배 없음) —
  // 비워두면 견적서에 이름만 표시됩니다.
  lineItems: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        amount: z.number().int().min(0).max(500_000_000).optional(),
      })
    )
    .max(20)
    .optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const { id: conversationId } = await params;
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: { customer: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
  }

  const order = await createOrder({
    title: parsed.data.title,
    description: parsed.data.description,
    amount: parsed.data.amount,
    customerName: parsed.data.customerName || conversation.customer.name || conversation.customer.email,
    customerEmail: conversation.customer.email,
    customerPhone: conversation.customer.phone || undefined,
    businessRegNo: parsed.data.businessRegNo || undefined,
    createdById: session.adminId,
    customerId: conversation.customer.id,
    conversationId,
    lineItems: parsed.data.lineItems,
  });

  const message = await postPaymentRequestMessage({
    conversationId,
    orderId: order.id,
    label: `결제 요청: ${order.title}`,
  });

  return NextResponse.json({ ok: true, message, order });
}
