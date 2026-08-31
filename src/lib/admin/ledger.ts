import "server-only";
import { prisma } from "@/lib/prisma";
import type { ProjectStage, ProofType } from "@prisma/client";
import { PROOF_TYPE_LABEL } from "@/lib/admin/status";

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
  type: "REVENUE" | "REFUND";
  title: string;
  customerName: string;
  amount: number; // REFUND는 음수로 반환
  // 사업자등록번호를 입력받은 주문이면 사업자, 안 받았으면 개인으로 분류합니다 —
  // 세금계산서(사업자용)/현금영수증(개인용) 중 뭘 준비해야 할지 장부에서 바로 구분되도록.
  customerType: CustomerType;
  detail: string | null; // 상세 기능
  businessRegNo: string | null;
  phone: string | null;
  proofType: ProofType | null; // 증빙 수단 (manual 만)
  memo: string | null; // 비고 (manual 만)
  progressStage: ProjectStage | null; // manual 항목엔 없음
};

export type DailyTotal = { revenue: number; refund: number };

/**
 * 특정 월의 매출/환불 내역을 날짜별로 집계합니다. year/month는 1-based 월(1~12)입니다.
 * 달력 탐색용 얇은 래퍼 — 실제 조회는 getLedgerEntries가 합니다.
 */
export async function getMonthlyLedger(
  year: number,
  month: number,
  customerType?: CustomerType
) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return getLedgerEntries(start, end, customerType);
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
    prisma.manualLedgerEntry.findMany({
      where: { occurredAt: { gte: start, lt: end } },
      orderBy: { occurredAt: "asc" },
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
      proofType: null,
      memo: null,
      progressStage: p.order.progressStage,
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
      proofType: null,
      memo: null,
      progressStage: r.payment.order.progressStage,
    })),
    ...manual.map((e) => ({
      id: `manual:${e.id}`,
      source: "manual" as const,
      manualId: e.id,
      date: e.occurredAt,
      type: e.kind === "REFUND" ? ("REFUND" as const) : ("REVENUE" as const),
      title: e.title,
      customerName: e.customerName,
      amount: e.kind === "REFUND" ? -e.amount : e.amount,
      customerType: typeOf(e.businessRegNo),
      detail: e.detail,
      businessRegNo: e.businessRegNo,
      phone: e.phone,
      proofType: e.proofType,
      memo: e.memo,
      progressStage: null,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (customerType) {
    entries = entries.filter((e) => e.customerType === customerType);
  }

  const daily = new Map<number, DailyTotal>();
  for (const entry of entries) {
    const day = entry.date.getDate();
    const current = daily.get(day) ?? { revenue: 0, refund: 0 };
    if (entry.type === "REVENUE") current.revenue += entry.amount;
    else current.refund += Math.abs(entry.amount);
    daily.set(day, current);
  }

  const totalRevenue = entries
    .filter((e) => e.type === "REVENUE")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalRefund = entries
    .filter((e) => e.type === "REFUND")
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  return { entries, daily, totalRevenue, totalRefund, netRevenue: totalRevenue - totalRefund };
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
  const header = ["결제일", "구분", "외주 프로젝트명", "발주처/고객명", "유형", "사업자등록번호", "연락처", "증빙 수단", "비고", "금액(KRW)"].join(",");
  const rows = entries.map((e) =>
    [
      csvField(
        new Intl.DateTimeFormat("ko-KR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(e.date)
      ),
      csvField(e.type === "REVENUE" ? "결제" : "환불"),
      csvField(e.title),
      csvField(e.customerName),
      csvField(CUSTOMER_TYPE_LABEL[e.customerType]),
      csvField(e.businessRegNo ?? ""),
      csvField(e.phone ?? ""),
      csvField(e.proofType ? PROOF_TYPE_LABEL[e.proofType].label : ""),
      csvField(e.memo ?? ""),
      csvField(e.amount),
    ].join(",")
  );
  return "﻿" + [header, ...rows].join("\r\n");
}
