import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { updateOrderProgress } from "@/lib/progress";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

const schema = z.object({
  orderId: z.string().min(1),
  stage: z.enum(["RECEIVED", "IN_PROGRESS", "DELIVERED"]),
  note: z.string().trim().max(500).optional(),
});

export async function POST(
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
    select: { customerId: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "대화를 찾을 수 없습니다." }, { status: 404 });
  }

  // 이 대화의 고객 소유가 아닌 주문 id를 넘겨 남의 주문 진행 상황을 조작하는 것을 방지
  const order = await prisma.order.findFirst({
    where: { id: parsed.data.orderId, customerId: conversation.customerId },
    select: { id: true },
  });
  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  const { message } = await updateOrderProgress({
    orderId: order.id,
    stage: parsed.data.stage,
    note: parsed.data.note,
  });

  return NextResponse.json({ ok: true, message });
}
