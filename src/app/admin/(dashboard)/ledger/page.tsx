import Link from "next/link";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { Segmented } from "@/components/admin/ui/Segmented";
import { DateRangeFilter } from "@/components/admin/ui/DateRangeFilter";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { IconCalendar, IconChevronLeft, IconChevronRight, IconDownload } from "@/components/admin/icons";
import { PROJECT_STAGE_LABEL, PROOF_TYPE_LABEL, EXPENSE_CATEGORY_LABEL } from "@/lib/admin/status";
import {
  AddLedgerEntry,
  ManualEntryActions,
  AutoEntryProof,
} from "@/components/admin/ManualLedgerEntry";
import {
  getLedgerEntries,
  listConversationsForPicker,
  CUSTOMER_TYPE_LABEL,
  type CustomerType,
} from "@/lib/admin/ledger";

export const dynamic = "force-dynamic";

function amountText(n: number) {
  return `${n < 0 ? "-" : ""}₩${Math.abs(n).toLocaleString("ko-KR")}`;
}

const DATE_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const DATE_ONLY = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" });

type Tone = "neutral" | "blue" | "green" | "amber" | "red";
const NOTION_PILL: Record<Tone, string> = {
  neutral: "bg-[#e9e9e7] text-[#4b4a45]",
  blue: "bg-[#d3e5ef] text-[#1c3d52]",
  green: "bg-[#dbeddb] text-[#22432f]",
  amber: "bg-[#fadec9] text-[#5a3417]",
  red: "bg-[#ffe2dd] text-[#5d1715]",
};

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${NOTION_PILL[tone]}`}
    >
      {children}
    </span>
  );
}

function Th({ kind, label, right }: { kind: "text" | "num" | "date" | "select"; label: string; right?: boolean }) {
  const glyph = { text: "Aa", num: "#", date: "☷", select: "⌄" }[kind];
  return (
    <th className={`whitespace-nowrap px-3 py-2 font-medium ${right ? "text-right" : "text-left"}`}>
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[10px] text-admin-muted/60">{glyph}</span>
        {label}
      </span>
    </th>
  );
}

const KIND_PILL: Record<"REVENUE" | "REFUND" | "EXPENSE", { label: string; tone: Tone }> = {
  REVENUE: { label: "결제", tone: "neutral" },
  REFUND: { label: "환불", tone: "red" },
  EXPENSE: { label: "지출", tone: "amber" },
};

export default async function AdminLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{
    y?: string;
    m?: string;
    q?: string;
    p?: string;
    type?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { y, m, q, p, type, from, to } = await searchParams;
  const now = new Date();
  const customerType: CustomerType | undefined =
    type === "INDIVIDUAL" || type === "BUSINESS" ? type : undefined;

  const isCustomRange = Boolean(from && to);
  const period: "m" | "q" | "y" = p === "q" || p === "y" ? p : "m";

  const year = y ? Number(y) : now.getFullYear();
  const month = m ? Number(m) : now.getMonth() + 1;
  const quarter = q ? Math.min(4, Math.max(1, Number(q))) : Math.floor(now.getMonth() / 3) + 1;

  // 조회 구간
  let start: Date;
  let end: Date;
  let heading: string;
  if (isCustomRange) {
    start = new Date(`${from}T00:00:00`);
    end = new Date(`${to}T00:00:00`);
    end.setDate(end.getDate() + 1);
    heading = `${from} ~ ${to}`;
  } else if (period === "y") {
    start = new Date(year, 0, 1);
    end = new Date(year + 1, 0, 1);
    heading = `${year}년`;
  } else if (period === "q") {
    start = new Date(year, (quarter - 1) * 3, 1);
    end = new Date(year, quarter * 3, 1);
    heading = `${year}년 ${quarter}분기`;
  } else {
    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 1);
    heading = `${year}년 ${month}월`;
  }

  const [
    { entries, totalRevenue, totalRefund, totalExpense, netProfit },
    conversations,
  ] = await Promise.all([
    getLedgerEntries(start, end, customerType),
    listConversationsForPicker(),
  ]);
  const rows = [...entries].reverse();

  // 기간을 월 단위로 쪼갠 매출/지출(환불 포함) 대비. 조회 구간이 한 달이면 한 칸,
  // 분기·연이면 3·12칸. 총계 카드 숫자와 정확히 일치하도록 같은 entries 로 계산합니다.
  const monthlyMap = new Map<string, { revenue: number; outflow: number }>();
  for (const e of entries) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    const cur = monthlyMap.get(key) ?? { revenue: 0, outflow: 0 };
    if (e.type === "REVENUE") cur.revenue += Math.abs(e.amount);
    else cur.outflow += Math.abs(e.amount);
    monthlyMap.set(key, cur);
  }
  const monthly = [...monthlyMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ key, ...v, net: v.revenue - v.outflow }));
  const monthlyPeak = Math.max(1, ...monthly.map((m) => Math.max(m.revenue, m.outflow)));

  // 경비(지출) 항목별 합계 — 세무 신고 시 어디에 돈이 나갔는지 한눈에.
  const expenseByCategory = new Map<string, number>();
  for (const e of entries) {
    if (e.type !== "EXPENSE") continue;
    const key = e.expenseCategory ?? "ETC";
    expenseByCategory.set(key, (expenseByCategory.get(key) ?? 0) + Math.abs(e.amount));
  }
  const expenseRows = [...expenseByCategory.entries()].sort((a, b) => b[1] - a[1]);
  const expensePeak = Math.max(1, ...expenseRows.map(([, v]) => v));

  const typeParam = customerType ? `&type=${customerType}` : "";

  // 이전/다음 이동 링크
  function navHref(dir: -1 | 1) {
    if (period === "y") return `/admin/ledger?p=y&y=${year + dir}${typeParam}`;
    if (period === "q") {
      let ny = year;
      let nq = quarter + dir;
      if (nq < 1) { nq = 4; ny -= 1; }
      if (nq > 4) { nq = 1; ny += 1; }
      return `/admin/ledger?p=q&y=${ny}&q=${nq}${typeParam}`;
    }
    let ny = year;
    let nm = month + dir;
    if (nm < 1) { nm = 12; ny -= 1; }
    if (nm > 12) { nm = 1; ny += 1; }
    return `/admin/ledger?y=${ny}&m=${nm}${typeParam}`;
  }

  const periodBase = "/admin/ledger";
  const exportHref = isCustomRange
    ? `/api/admin/ledger/export?from=${from}&to=${to}${typeParam}`
    : `/api/admin/ledger/export?p=${period}&y=${year}&m=${month}&q=${quarter}${typeParam}`;

  const typeFilterBase = isCustomRange
    ? `/admin/ledger?from=${from}&to=${to}`
    : period === "y"
      ? `/admin/ledger?p=y&y=${year}`
      : period === "q"
        ? `/admin/ledger?p=q&y=${year}&q=${quarter}`
        : `/admin/ledger?y=${year}&m=${month}`;

  return (
    <div className="pb-16">
      <AdminPageHeader title="장부" description="결제·환불·지출을 한곳에서. 노션 결제 내역 DB 구성." />

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pt-6">
        <div className="flex items-center gap-3">
          {isCustomRange ? (
            <h2 className="text-lg font-semibold text-admin-text">{heading}</h2>
          ) : (
            <>
              <Link
                href={navHref(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-admin-muted transition-colors hover:bg-admin-content hover:text-admin-blue"
                aria-label="이전"
              >
                <IconChevronLeft className="h-4 w-4" />
              </Link>
              <h2 className="min-w-[7rem] text-center text-lg font-semibold text-admin-text">{heading}</h2>
              <Link
                href={navHref(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-admin-muted transition-colors hover:bg-admin-content hover:text-admin-blue"
                aria-label="다음"
              >
                <IconChevronRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isCustomRange && (
            <Segmented
              active={
                period === "y"
                  ? `${periodBase}?p=y&y=${year}`
                  : period === "q"
                    ? `${periodBase}?p=q&y=${year}&q=${quarter}`
                    : `${periodBase}?y=${year}&m=${month}`
              }
              items={[
                { label: "월", href: `${periodBase}?y=${year}&m=${month}` },
                { label: "분기", href: `${periodBase}?p=q&y=${year}&q=${quarter}` },
                { label: "연", href: `${periodBase}?p=y&y=${year}` },
              ]}
            />
          )}
          <DateRangeFilter />
          <Segmented
            active={`${typeFilterBase}${typeParam}`}
            items={[
              { label: "전체", href: typeFilterBase },
              { label: "개인", href: `${typeFilterBase}&type=INDIVIDUAL` },
              { label: "사업자", href: `${typeFilterBase}&type=BUSINESS` },
            ]}
          />
          <a
            href={exportHref}
            className="flex items-center gap-1.5 rounded-lg border border-admin-border px-3.5 py-2 text-xs font-medium text-admin-text transition-colors hover:border-admin-blue hover:text-admin-blue"
          >
            <IconDownload className="h-4 w-4" />
            CSV 다운로드
          </a>
        </div>
      </div>

      <RevealGroup className="grid grid-cols-2 gap-4 px-8 pt-4 md:grid-cols-4" stagger={0.05}>
        <RevealItem>
          <AdminCard>
            <p className="text-xs font-medium text-admin-muted">매출</p>
            <p className="mt-1.5 text-xl font-semibold text-admin-text">{amountText(totalRevenue)}</p>
          </AdminCard>
        </RevealItem>
        <RevealItem>
          <AdminCard>
            <p className="text-xs font-medium text-admin-muted">환불</p>
            <p className="mt-1.5 text-xl font-semibold text-admin-red">
              {totalRefund > 0 ? `-${amountText(totalRefund)}` : amountText(0)}
            </p>
          </AdminCard>
        </RevealItem>
        <RevealItem>
          <AdminCard>
            <p className="text-xs font-medium text-admin-muted">지출</p>
            <p className="mt-1.5 text-xl font-semibold text-admin-red">
              {totalExpense > 0 ? `-${amountText(totalExpense)}` : amountText(0)}
            </p>
          </AdminCard>
        </RevealItem>
        <RevealItem>
          <AdminCard>
            <p className="text-xs font-medium text-admin-muted">순이익</p>
            <p
              className={`mt-1.5 text-xl font-semibold ${netProfit < 0 ? "text-admin-red" : "text-admin-text"}`}
            >
              {amountText(netProfit)}
            </p>
          </AdminCard>
        </RevealItem>
      </RevealGroup>

      {(monthly.length > 1 || expenseRows.length > 0) && (
        <div className="grid gap-4 px-8 pt-4 lg:grid-cols-2">
          {monthly.length > 1 && (
            <AdminCard>
              <h2 className="text-sm font-semibold text-admin-text">월별 매출 · 지출</h2>
              <ul className="mt-4 space-y-3">
                {monthly.map((m) => (
                  <li key={m.key} className="text-xs">
                    <div className="flex items-center justify-between text-admin-muted">
                      <span className="tabular-nums">{m.key}</span>
                      <span
                        className={`tabular-nums font-medium ${m.net < 0 ? "text-admin-red" : "text-admin-text"}`}
                      >
                        {amountText(m.net)}
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-1">
                      <div className="h-1.5 rounded-full bg-admin-content">
                        <div
                          className="h-1.5 rounded-full bg-admin-green"
                          style={{ width: `${(m.revenue / monthlyPeak) * 100}%` }}
                        />
                      </div>
                      <div className="h-1.5 rounded-full bg-admin-content">
                        <div
                          className="h-1.5 rounded-full bg-admin-red"
                          style={{ width: `${(m.outflow / monthlyPeak) * 100}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-4 text-[11px] text-admin-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-admin-green" />매출
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-admin-red" />지출 · 환불
                </span>
              </div>
            </AdminCard>
          )}
          {expenseRows.length > 0 && (
            <AdminCard>
              <h2 className="text-sm font-semibold text-admin-text">경비 항목별 지출</h2>
              <ul className="mt-4 space-y-3">
                {expenseRows.map(([cat, value]) => {
                  const meta = EXPENSE_CATEGORY_LABEL[cat as keyof typeof EXPENSE_CATEGORY_LABEL];
                  return (
                    <li key={cat} className="text-xs">
                      <div className="flex items-center justify-between">
                        <Pill tone={meta?.tone ?? "neutral"}>{meta?.label ?? cat}</Pill>
                        <span className="tabular-nums font-medium text-admin-text">
                          {amountText(value)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-admin-content">
                        <div
                          className="h-1.5 rounded-full bg-admin-amber"
                          style={{ width: `${(value / expensePeak) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </AdminCard>
          )}
        </div>
      )}

      <div className="px-8 pt-5">
        <AddLedgerEntry conversations={conversations} />

        {rows.length === 0 ? (
          <AdminCard className="mt-4 p-0">
            <AdminEmptyState icon={<IconCalendar className="h-6 w-6" />} title="이 기간 거래 내역이 없습니다." />
          </AdminCard>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-admin-border bg-admin-surface">
            <table className="w-full min-w-[96rem] border-collapse text-[13px] text-admin-text">
              <thead>
                <tr className="border-b border-admin-border text-admin-muted">
                  <Th kind="date" label="결제일" />
                  <Th kind="text" label="발주처 / 고객 / 지급처" />
                  <Th kind="text" label="항목명" />
                  <Th kind="text" label="상세" />
                  <Th kind="num" label="금액(KRW)" right />
                  <Th kind="select" label="구분" />
                  <Th kind="select" label="경비 항목" />
                  <Th kind="select" label="진행 상태" />
                  <Th kind="select" label="유형" />
                  <Th kind="text" label="사업자등록번호" />
                  <Th kind="text" label="연락처" />
                  <Th kind="select" label="증빙 수단" />
                  <Th kind="date" label="세금계산서 발행일" />
                  <Th kind="text" label="비고" />
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const stage = e.progressStage ? PROJECT_STAGE_LABEL[e.progressStage] : null;
                  const k = KIND_PILL[e.type];
                  return (
                    <tr
                      key={e.id}
                      className="group border-b border-admin-border/60 transition-colors last:border-0 hover:bg-admin-content/50"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-admin-muted tabular-nums">
                        {DATE_FORMAT.format(e.date)}
                        {e.source === "manual" && (
                          <span className="ml-1.5 rounded bg-admin-bg-soft px-1 py-0.5 text-[10px] font-medium text-admin-muted">
                            직접
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">{e.customerName}</td>
                      <td className="max-w-[16rem] truncate px-3 py-2">{e.title}</td>
                      <td className="max-w-[16rem] truncate px-3 py-2 text-admin-muted">{e.detail || "–"}</td>
                      <td
                        className={`whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums ${
                          e.type === "REVENUE" ? "" : "text-admin-red"
                        }`}
                      >
                        {e.type === "REVENUE" ? "" : "-"}
                        {amountText(Math.abs(e.amount))}
                      </td>
                      <td className="px-3 py-2">
                        <Pill tone={k.tone}>{k.label}</Pill>
                      </td>
                      <td className="px-3 py-2">
                        {e.expenseCategory ? (
                          <Pill tone={EXPENSE_CATEGORY_LABEL[e.expenseCategory].tone}>
                            {EXPENSE_CATEGORY_LABEL[e.expenseCategory].label}
                          </Pill>
                        ) : (
                          <span className="text-admin-muted">–</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {stage ? <Pill tone={stage.tone}>{stage.label}</Pill> : <span className="text-admin-muted">–</span>}
                      </td>
                      <td className="px-3 py-2">
                        <Pill tone={e.customerType === "BUSINESS" ? "blue" : "neutral"}>
                          {CUSTOMER_TYPE_LABEL[e.customerType]}
                        </Pill>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-admin-muted tabular-nums">
                        {e.businessRegNo || "–"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-admin-muted tabular-nums">{e.phone || "–"}</td>
                      <td className="px-3 py-2">
                        {e.proofType ? (
                          <Pill tone={PROOF_TYPE_LABEL[e.proofType].tone}>{PROOF_TYPE_LABEL[e.proofType].label}</Pill>
                        ) : (
                          <span className="text-admin-muted">–</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-admin-muted tabular-nums">
                        {e.taxInvoiceIssuedAt ? DATE_ONLY.format(e.taxInvoiceIssuedAt) : "–"}
                      </td>
                      <td className="max-w-[14rem] truncate px-3 py-2 text-admin-muted">{e.memo || "–"}</td>
                      <td className="px-2 py-2 text-right">
                        {e.source === "manual" && e.manualId && (
                          <ManualEntryActions
                            conversations={conversations}
                            entry={{
                              id: e.manualId,
                              occurredAt: e.date,
                              kind: e.type,
                              customerName: e.customerName,
                              title: e.title,
                              detail: e.detail,
                              amount: e.amount,
                              businessRegNo: e.businessRegNo,
                              phone: e.phone,
                              proofType: e.proofType,
                              expenseCategory: e.expenseCategory,
                              taxInvoiceIssuedAt: e.taxInvoiceIssuedAt,
                              memo: e.memo,
                              conversationId: e.conversationId,
                            }}
                          />
                        )}
                        {e.source === "auto" && (
                          <AutoEntryProof
                            entry={{
                              id: e.id,
                              proofType: e.proofType,
                              taxInvoiceIssuedAt: e.taxInvoiceIssuedAt,
                              memo: e.memo,
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
