import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { sendContractRequestEmail } from "@/lib/email";

export const runtime = "nodejs";

// 이미 발송된(SENT) 계약서의 서명 링크를 같은 조건 그대로 다시 보냅니다.
// sentAt 을 지금으로 갱신해 서명 유효 기간도 다시 시작됩니다.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }
  const session = await requireAdminSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { order: { select: { title: true } } },
  });
  if (!contract) {
    return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
  }
  if (contract.status !== "SENT") {
    return NextResponse.json(
      { error: "서명 대기 중인 계약서만 재발송할 수 있습니다." },
      { status: 400 }
    );
  }

  const sentAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.contract.update({ where: { id: contract.id }, data: { sentAt } });
    await tx.auditLog.create({
      data: {
        adminId: session.adminId,
        action: "contract.resend",
        targetType: "Contract",
        targetId: contract.id,
        metadata: { orderId: contract.orderId, to: contract.clientEmail },
      },
    });
  });

  try {
    await sendContractRequestEmail({
      customerEmail: contract.clientEmail,
      customerName: contract.clientName,
      orderTitle: contract.order.title,
      amount: contract.amount,
      token: contract.token,
    });
  } catch (err) {
    console.error("[contract] 재발송 이메일 실패:", err);
    return NextResponse.json({ ok: true, emailFailed: true });
  }

  return NextResponse.json({ ok: true });
}
