import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { ledgerProofSchema } from "@/lib/validation/ledger";

export const runtime = "nodejs";

// 사이트 결제/환불(자동 집계 행)에 증빙 수단·세금계산서 발행일·비고를 채워 넣습니다.
// 금액·날짜·고객은 결제 사실이라 건드리지 않습니다.
export async function PATCH(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = ledgerProofSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const { source, id, proofType, taxInvoiceIssuedAt, memo } = parsed.data;
  const data = {
    ledgerProofType: proofType || null,
    ledgerTaxInvoiceIssuedAt: taxInvoiceIssuedAt ? new Date(taxInvoiceIssuedAt) : null,
    ledgerMemo: memo || null,
  };

  try {
    await prisma.$transaction(async (tx) => {
      if (source === "payment") {
        await tx.payment.update({ where: { id }, data });
      } else {
        await tx.refund.update({ where: { id }, data });
      }
      await tx.auditLog.create({
        data: {
          adminId: session.adminId,
          action: "ledger.proof_update",
          targetType: source === "payment" ? "Payment" : "Refund",
          targetId: id,
          metadata: { proofType: proofType || null, taxInvoiceIssuedAt: taxInvoiceIssuedAt || null },
        },
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "찾을 수 없는 결제 건입니다." }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
