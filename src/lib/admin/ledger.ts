import "server-only";
import { prisma } from "@/lib/prisma";
import type { ProjectStage, ProofType, ExpenseCategory } from "@prisma/client";
import { PROOF_TYPE_LABEL, EXPENSE_CATEGORY_LABEL } from "@/lib/admin/status";
import { postAdminReply } from "@/lib/chat";

export type CustomerType = "INDIVIDUAL" | "BUSINESS";

export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  INDIVIDUAL: "개인",
  BUSINESS: "사업자",
};

export type LedgerEntry = {
  id: string;
  // "auto" = Payment/Refund 에서 자동 집계, "manual" = 관리자가 장부에 직접 입력
  source: "auto" | "manual";
  manualId: string | null; // manual 항목의 원본 id (삭제용). auto 면 null
  date: Date;
  type: "REVENUE" | "REFUND" | "EXPENSE";
  title: string;
  customerName: string;
  amount: number; // REFUND·EXPENSE는 음수로 반환
  // 사업자등록번호를 입력받은 주문이면 사업자, 안 받았으면 개인으로 분류합니다 —
  // 세금계산서(사업자용)/현금영수증(개인용) 중 뭘 준비해야 할지 장부에서 바로 구분되도록.
  customerType: CustomerType;
  detail: string | null; // 상세 기능
  businessRegNo: string | null;
  phone: string | null;
  proofType: ProofType | null; // 증빙 수단 (manual 만)
  expenseCategory: ExpenseCategory | null; // 경비 항목 (지출일 때만)
  taxInvoiceIssuedAt: Date | null; // 세금계산서 발행일 (manual 만)
  memo: string | null; // 비고 (manual 만)
  progressStage: ProjectStage | null; // manual 항목엔 없음
  conversationId: string | null; // 연결된 고객 대화 (manual 만)
};

export type DailyTotal = { revenue: number; refund: number; expense: number };

const SEOUL_LONG_DATE = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "Asia/Seoul",
});

// 장부 항목을 연결된 고객 대화로 안내하는 메시지. 관리자가 "대화에 알림"을 켰을 때만
// 호출됩니다. 실패해도(대화 없음 등) 장부 저장 자체는 되돌리지 않습니다.
export async function postLedgerNotice(input: {
  conversationId: string;
  kind: "REVENUE" | "REFUND" | "EXPENSE";
  title: string;
  amount: number; // 항상 양수
  occurredAt: Date;
  proofType: ProofType | null;
  isUpdate: boolean;
}): Promise<void> {
  const won = `₩${input.amount.toLocaleString("ko-KR")}`;
  const date = SEOUL_LONG_DATE.format(input.occurredAt);
  const tail = input.isUpdate ? "\n(내용이 정정되었습니다.)" : "";

  let text: string;
  if (input.kind === "REFUND") {
    text = `[환불 처리 안내]\n· ${input.title}\n· ${won} · ${date}${tail}`;
  } else if (input.kind === "EXPENSE") {
    text = `${input.title}\n· ${won} · ${date}${tail}`;
  } else {
    const proof = input.proofType ? `\n· 증빙: ${PROOF_TYPE_LABEL[input.proofType].label}` : "";
    text = `[결제 확인]\n· ${input.title}\n· ${won} · ${date}${proof}${tail}`;
  }

  try {
    await postAdminReply({ conversationId: input.conversationId, body: text });
  } catch (err) {
    console.error("[ledger] 대화 안내 전송 실패:", err);
  }
}

// 관리자 편집 UI 의 대화 선택용 — 최근 대화 목록(고객명 포함).
export async function listConversationsForPicker(limit = 200) {
  const rows = await prisma.chatConversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    take: limit,
    select: { id: true, title: true, customer: { select: { name: true } } },
  });
  return rows.map((c) => ({
    id: c.id,
    label: c.customer.name + (c.title ? ` · ${c.title}` : ""),
  }));
}

/**
 * start(포함) ~ end(미포함) 구간의 매출/환불 내역을 날짜별로 집계합니다.
 * 매출은 Payment.approvedAt(결제 확정 시점), 환불은 Refund.cancelledAt 기준으로 잡습니다 —
 * "언제 실제로 돈이 오갔는지" 기준이라 회계 장부 성격에 맞습니다.
 */
export async function getLedgerEntries(
  start: Date,
  end: Date,
  customerType?: CustomerType
) {
  const orderSelect = {
    title: true,
    description: true,
    customerName: true,
    customerPhone: true,
    businessRegNo: true,
    progressStage: true,
  } as const;

  const [payments, refunds, manual] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "PAID", approvedAt: { gte: start, lt: end } },
      include: { order: { select: orderSelect } },
      orderBy: { approvedAt: "asc" },
    }),
    prisma.refund.findMany({
      where: { cancelledAt: { gte: start, lt: end } },
      include: { payment: { include: { order: { select: orderSelect } } } },
      orderBy: { cancelledAt: "asc" },
    }),
    // 배포 직후처럼 DB에 아직 ManualLedgerEntry 테이블이 없어도 장부가 죽지 않도록.
    prisma.manualLedgerEntry
      .findMany({
        where: { occurredAt: { gte: start, lt: end } },
        orderBy: { occurredAt: "asc" },
      })
      .catch((err) => {
        console.error("[ledger] manualLedgerEntry 조회 실패 (스키마 미적용?):", err);
        return [] as Awaited<ReturnType<typeof prisma.manualLedgerEntry.findMany>>;
      }),
  ]);

  const typeOf = (businessRegNo: string | null): CustomerType =>
    businessRegNo ? "BUSINESS" : "INDIVIDUAL";

  let entries: LedgerEntry[] = [
    ...payments.map((p) => ({
      id: `payment:${p.id}`,
      source: "auto" as const,
      manualId: null,
      date: p.approvedAt as Date,
      type: "REVENUE" as const,
      title: p.order.title,
      customerName: p.order.customerName,
      amount: p.amount,
      customerType: typeOf(p.order.businessRegNo),
      detail: p.order.description,
      businessRegNo: p.order.businessRegNo,
      phone: p.order.customerPhone,
      proofType: p.ledgerProofType,
      expenseCategory: null,
      taxInvoiceIssuedAt: p.ledgerTaxInvoiceIssuedAt,
      memo: p.ledgerMemo,
      progressStage: p.order.progressStage,
      conversationId: null,
    })),
    ...refunds.map((r) => ({
      id: `refund:${r.id}`,
      source: "auto" as const,
      manualId: null,
      date: r.cancelledAt,
      type: "REFUND" as const,
      title: r.payment.order.title,
      customerName: r.payment.order.customerName,
      amount: -r.amount,
      customerType: typeOf(r.payment.order.businessRegNo),
      detail: r.payment.order.description,
      businessRegNo: r.payment.order.businessRegNo,
      phone: r.payment.order.customerPhone,
      proofType: r.ledgerProofType,
      expenseCategory: null,
      taxInvoiceIssuedAt: r.ledgerTaxInvoiceIssuedAt,
      memo: r.ledgerMemo,
      progressStage: r.payment.order.progressStage,
      conversationId: null,
    })),
    ...manual.map((e) => ({
      id: `manual:${e.id}`,
      source: "manual" as const,
      manualId: e.id,
      date: e.occurredAt,
      type: e.kind, // "REVENUE" | "REFUND" | "EXPENSE"
      title: e.title,
      customerName: e.customerName,
      amount: e.kind === "REVENUE" ? e.amount : -e.amount,
      customerType: typeOf(e.businessRegNo),
      detail: e.detail,
      businessRegNo: e.businessRegNo,
      phone: e.phone,
      proofType: e.proofType,
      expenseCategory: e.expenseCategory,
      taxInvoiceIssuedAt: e.taxInvoiceIssuedAt,
      memo: e.memo,
      progressStage: null,
      conversationId: e.conversationId,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (customerType) {
    entries = entries.filter((e) => e.customerType === customerType);
  }

  const daily = new Map<number, DailyTotal>();
  for (const entry of entries) {
    const day = entry.date.getDate();
    const current = daily.get(day) ?? { revenue: 0, refund: 0, expense: 0 };
    if (entry.type === "REVENUE") current.revenue += entry.amount;
    else if (entry.type === "REFUND") current.refund += Math.abs(entry.amount);
    else current.expense += Math.abs(entry.amount);
    daily.set(day, current);
  }

  const sumAbs = (t: LedgerEntry["type"]) =>
    entries.filter((e) => e.type === t).reduce((sum, e) => sum + Math.abs(e.amount), 0);

  const totalRevenue = sumAbs("REVENUE");
  const totalRefund = sumAbs("REFUND");
  const totalExpense = sumAbs("EXPENSE");

  return {
    entries,
    daily,
    totalRevenue,
    totalRefund,
    totalExpense,
    netProfit: totalRevenue - totalRefund - totalExpense,
  };
}

// CSV 필드에 쉼표·큰따옴표·줄바꿈이 있으면 큰따옴표로 감싸고 내부 큰따옴표는 2개로
// 이스케이프합니다 (RFC 4180). 고객명/항목명에 쉼표가 들어있어도 세금 신고용 파일이
// 깨지지 않도록 하기 위함입니다.
function csvField(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 국세청 신고 등 외부 용도로 쓸 수 있도록 월별 거래 내역을 CSV로 만듭니다.
 * 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM을 앞에 붙입니다.
 */
export function buildLedgerCsv(entries: LedgerEntry[]): string {
  const kindLabel = { REVENUE: "결제", REFUND: "환불", EXPENSE: "지출" } as const;
  const dateOnly = new Intl.DateTimeFormat("ko-KR", { dateStyle: "short" });
  const header = [
    "결제일", "구분", "항목명", "발주처/고객/지급처", "유형", "경비 항목",
    "사업자등록번호", "연락처", "증빙 수단", "세금계산서 발행일", "비고", "금액(KRW)",
  ].join(",");
  const rows = entries.map((e) =>
    [
      csvField(new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(e.date)),
      csvField(kindLabel[e.type]),
      csvField(e.title),
      csvField(e.customerName),
      csvField(CUSTOMER_TYPE_LABEL[e.customerType]),
      csvField(e.expenseCategory ? EXPENSE_CATEGORY_LABEL[e.expenseCategory].label : ""),
      csvField(e.businessRegNo ?? ""),
      csvField(e.phone ?? ""),
      csvField(e.proofType ? PROOF_TYPE_LABEL[e.proofType].label : ""),
      csvField(e.taxInvoiceIssuedAt ? dateOnly.format(e.taxInvoiceIssuedAt) : ""),
      csvField(e.memo ?? ""),
      csvField(e.type === "REVENUE" ? e.amount : -Math.abs(e.amount)),
    ].join(",")
  );
  return "﻿" + [header, ...rows].join("\r\n");
}
