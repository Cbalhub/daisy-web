import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

// 장부 수동 항목 삭제 — 자동 집계 항목(Payment/Refund)은 여기로 오지 않습니다(id 가 다름).
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const existing = await prisma.manualLedgerEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "찾을 수 없는 항목입니다." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.manualLedgerEntry.delete({ where: { id } });
    await tx.auditLog.create({
      data: {
        adminId: session.adminId,
        action: "ledger.manual_entry_delete",
        targetType: "ManualLedgerEntry",
        targetId: id,
        metadata: {
          kind: existing.kind,
          amount: existing.amount,
          occurredAt: existing.occurredAt.toISOString(),
          title: existing.title,
        },
      },
    });
  });

  return NextResponse.json({ ok: true });
}
