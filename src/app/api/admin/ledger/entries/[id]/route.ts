import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { manualLedgerEntrySchema } from "@/lib/validation/ledger";
import { postLedgerNotice } from "@/lib/admin/ledger";

export const runtime = "nodejs";

// 장부 수동 항목 수정 — 모든 칸을 고칠 수 있습니다. "대화에 알림"을 켜면 연결된
// 고객 대화로 정정 안내가 갑니다.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = manualLedgerEntrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const { id } = await ctx.params;
  const existing = await prisma.manualLedgerEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "찾을 수 없는 항목입니다." }, { status: 404 });
  }

  const {
    occurredAt,
    kind,
    title,
    detail,
    customerName,
    amount,
    businessRegNo,
    phone,
    proofType,
    expenseCategory,
    taxInvoiceIssuedAt,
    memo,
    conversationId,
    notifyChat,
  } = parsed.data;

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const row = await tx.manualLedgerEntry.update({
        where: { id },
        data: {
          occurredAt: new Date(occurredAt),
          kind,
          title,
          detail: detail || null,
          customerName,
          amount,
          businessRegNo: businessRegNo || null,
          phone: phone || null,
          proofType: proofType || null,
          expenseCategory: kind === "EXPENSE" && expenseCategory ? expenseCategory : null,
          taxInvoiceIssuedAt: taxInvoiceIssuedAt ? new Date(taxInvoiceIssuedAt) : null,
          memo: memo || null,
          conversationId: conversationId || null,
        },
      });
      await tx.auditLog.create({
        data: {
          adminId: session.adminId,
          action: "ledger.manual_entry_update",
          targetType: "ManualLedgerEntry",
          targetId: id,
          metadata: {
            before: {
              kind: existing.kind,
              amount: existing.amount,
              occurredAt: existing.occurredAt.toISOString(),
              title: existing.title,
            },
            after: { kind, amount, occurredAt: row.occurredAt.toISOString(), title },
          },
        },
      });
      return row;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json({ error: "연결하려는 대화를 찾을 수 없습니다." }, { status: 400 });
    }
    throw err;
  }

  if (conversationId && notifyChat) {
    await postLedgerNotice({
      conversationId,
      kind,
      title,
      amount,
      occurredAt: updated.occurredAt,
      proofType: updated.proofType,
      isUpdate: true,
    });
  }

  return NextResponse.json({ ok: true, id: updated.id });
}

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
