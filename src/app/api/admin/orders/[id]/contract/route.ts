import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { getBusinessSettings } from "@/lib/settings";
import { companySnapshotFromSettings } from "@/lib/contract";
import { createContractSchema } from "@/lib/validation/contract";
import { sendContractRequestEmail } from "@/lib/email";

export const runtime = "nodejs";

// 주문에서 용역계약서를 발행하고 고객에게 서명 링크를 보냅니다.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }
  const session = await requireAdminSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = createContractSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { contracts: true },
  });
  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }
  if (order.contracts.some((c) => c.status === "SIGNED")) {
    return NextResponse.json(
      { error: "이미 서명이 완료된 계약서가 있습니다." },
      { status: 400 }
    );
  }

  const settings = await getBusinessSettings();
  const { scope, amount, startDate, endDate, warrantyMonths, paymentTerms, specialTerms, clientBizNo } =
    parsed.data;

  const contract = await prisma.$transaction(async (tx) => {
    // 아직 서명 안 된 기존 계약서는 무효 처리 (재발송 시 여러 개가 살아있지 않도록)
    await tx.contract.updateMany({
      where: { orderId: order.id, status: "SENT" },
      data: { status: "VOID" },
    });

    const created = await tx.contract.create({
      data: {
        orderId: order.id,
        status: "SENT",
        sentAt: new Date(),
        scope,
        amount,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        warrantyMonths,
        paymentTerms: paymentTerms || null,
        specialTerms: specialTerms || null,
        clientName: order.customerName,
        clientPhone: order.customerPhone,
        clientEmail: order.customerEmail,
        clientBizNo: clientBizNo || order.businessRegNo || null,
        companySnapshot: companySnapshotFromSettings(settings),
        createdById: session.adminId,
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: session.adminId,
        action: "contract.create_and_send",
        targetType: "Contract",
        targetId: created.id,
        metadata: { orderId: order.id, amount, to: order.customerEmail },
      },
    });

    return created;
  });

  try {
    await sendContractRequestEmail({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      orderTitle: order.title,
      amount,
      token: contract.token,
    });
  } catch (err) {
    // 메일 발송이 실패해도 계약서는 생성됐으므로, 관리자가 링크를 직접 복사해
    // 보낼 수 있도록 성공으로 응답하되 경고만 함께 내려줍니다.
    console.error("[contract] 이메일 발송 실패:", err);
    return NextResponse.json({ ok: true, token: contract.token, emailFailed: true });
  }

  return NextResponse.json({ ok: true, token: contract.token });
}
