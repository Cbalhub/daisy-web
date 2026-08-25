import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cancelUnpaidOrder, cancelManualOrder } from "@/lib/payment-service";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

const bodySchema = z.object({
  reason: z.string().trim().min(1).max(200),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "취소 사유를 입력해 주세요." }, { status: 400 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  const result =
    order.status === "PAID"
      ? await cancelManualOrder({ orderId: id, adminId: session.adminId, reason: parsed.data.reason })
      : await cancelUnpaidOrder({ orderId: id, adminId: session.adminId, reason: parsed.data.reason });

  if (!result.ok) {
    const message =
      result.reason === "NOT_CANCELLABLE" || result.reason === "ALREADY_PROCESSED"
        ? "이미 처리된 주문입니다."
        : "취소 처리에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
