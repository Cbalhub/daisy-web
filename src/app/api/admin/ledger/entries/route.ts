import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { manualLedgerEntrySchema } from "@/lib/validation/ledger";
import { postLedgerNotice } from "@/lib/admin/ledger";

export const runtime = "nodejs";

// 장부 수동 항목 추가 — 사이트 결제 흐름을 거치지 않은 대금을 관리자가 직접 적어 넣습니다.
export async function POST(req: NextRequest) {
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

  let entry;
  try {
    entry = await prisma.$transaction(async (tx) => {
      const created = await tx.manualLedgerEntry.create({
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
          createdById: session.adminId,
        },
      });
      await tx.auditLog.create({
        data: {
          adminId: session.adminId,
          action: "ledger.manual_entry_create",
          targetType: "ManualLedgerEntry",
          targetId: created.id,
          metadata: { kind, amount, occurredAt: created.occurredAt.toISOString(), title },
        },
      });
      return created;
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
      occurredAt: entry.occurredAt,
      proofType: entry.proofType,
      isUpdate: false,
    });
  }

  return NextResponse.json({ ok: true, id: entry.id });
}
