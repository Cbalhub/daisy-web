import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { confirmManualPayment } from "@/lib/payment-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await confirmManualPayment({ orderId: id, adminId: session.adminId });
  if (!result.ok) {
    const message =
      result.reason === "NOT_CONFIRMABLE" || result.reason === "ALREADY_PROCESSED"
        ? "이미 처리됐거나 확인할 수 없는 상태입니다."
        : "주문을 찾을 수 없습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
