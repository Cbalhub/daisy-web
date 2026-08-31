import Link from "next/link";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { Segmented } from "@/components/admin/ui/Segmented";
import { DateRangeFilter } from "@/components/admin/ui/DateRangeFilter";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { IconCalendar, IconChevronLeft, IconChevronRight, IconDownload } from "@/components/admin/icons";
import {
  getMonthlyLedger,
  getLedgerEntries,
  CUSTOMER_TYPE_LABEL,
  type LedgerEntry,
  type CustomerType,
} from "@/lib/admin/ledger";

export const dynamic = "force-dynamic";

function amountText(n: number) {
  return `${n < 0 ? "-" : ""}₩${Math.abs(n).toLocaleString("ko-KR")}`;
}

// 같은 날짜(day)끼리 묶어서 최신 날짜가 위로 오게 정렬합니다 — 은행 앱 가계부처럼
// 날짜 헤더 아래에 그날의 거래를 나열하는 방식이 달력 그리드보다 한눈에 잘 들어옵니다.
function groupByDay(entries: LedgerEntry[]) {
  const groups = new Map<string, LedgerEntry[]>();
  for (const entry of entries) {
    const key = entry.date.toDateString();
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .map(([key, list]) => ({ date: new Date(key), entries: list }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

const DAY_HEADER_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
});
const TIME_FORMAT = new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" });

export default async function AdminLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; type?: string; from?: string; to?: string }>;
}) {
  const { y, m, type, from, to } = await searchParams;
  const now = new Date();
  const year = y ? Number(y) : now.getFullYear();
  const month = m ? Number(m) : now.getMonth() + 1;
  const customerType: CustomerType | undefined =
    type === "INDIVIDUAL" || type === "BUSINESS" ? type : undefined;

  // from/to가 둘 다 있으면 그 기간을 그대로 쓰고, 없으면 기존처럼 달력 월 단위로 봅니다.
  const isCustomRange = Boolean(from && to);
  const rangeStart = from ? new Date(`${from}T00:00:00`) : undefined;
  const rangeEnd = to ? new Date(`${to}T00:00:00`) : undefined;
  if (rangeEnd) rangeEnd.setDate(rangeEnd.getDate() + 1); // "to" 날짜 하루 끝까지 포함

  const { entries, totalRevenue, totalRefund, netRevenue } =
    isCustomRange && rangeStart && rangeEnd
      ? await getLedgerEntries(rangeStart, rangeEnd, customerType)
      : await getMonthlyLedger(year, month, customerType);
  const days = groupByDay(entries);
  const today = new Date();

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const typeParam = customerType ? `&type=${customerType}` : "";
  const exportHref = isCustomRange
    ? `/api/admin/ledger/export?from=${from}&to=${to}${typeParam}`
    : `/api/admin/ledger/export?y=${year}&m=${month}${typeParam}`;
  const filterBase = isCustomRange
    ? `/admin/ledger?from=${from}&to=${to}`
    : `/admin/ledger?y=${year}&m=${month}`;

  return (
    <div className="pb-16">
      <AdminPageHeader title="장부" description="매출·환불 내역을 날짜별로 확인합니다." />

      <div className="flex flex-wrap items-center justify-between gap-3 px-8 pt-6">
        <div className="flex items-center gap-3">
          {isCustomRange ? (
            <h2 className="text-lg font-semibold text-admin-text">
              {from} ~ {to}
            </h2>
          ) : (
            <>
              <Link
                href={`/admin/ledger?y=${prev.y}&m=${prev.m}${typeParam}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-admin-muted transition-colors hover:bg-admin-content hover:text-admin-blue"
                aria-label="이전 달"
              >
                <IconChevronLeft className="h-4 w-4" />
              </Link>
              <h2 className="text-lg font-semibold text-admin-text">
                {year}년 {month}월
              </h2>
              <Link
                href={`/admin/ledger?y=${next.y}&m=${next.m}${typeParam}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-admin-muted transition-colors hover:bg-admin-content hover:text-admin-blue"
                aria-label="다음 달"
              >
                <IconChevronRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter />
          <Segmented
            active={`${filterBase}${typeParam}`}
            items={[
              { label: "전체", href: filterBase },
              { label: "개인", href: `${filterBase}&type=INDIVIDUAL` },
              { label: "사업자", href: `${filterBase}&type=BUSINESS` },
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

      <RevealGroup className="grid grid-cols-1 gap-4 px-8 pt-4 md:grid-cols-3" stagger={0.05}>
        <RevealItem>
          <AdminCard>
            <p className="text-xs font-medium text-admin-muted">
              {isCustomRange ? "기간 내 매출" : "이번 달 매출"}
            </p>
            <p className="mt-1.5 text-xl font-semibold text-admin-blue">{amountText(totalRevenue)}</p>
          </AdminCard>
        </RevealItem>
        <RevealItem>
          <AdminCard>
            <p className="text-xs font-medium text-admin-muted">
              {isCustomRange ? "기간 내 환불" : "이번 달 환불"}
            </p>
            <p className="mt-1.5 text-xl font-semibold text-admin-red">
              {totalRefund > 0 ? `-${amountText(totalRefund)}` : amountText(0)}
            </p>
          </AdminCard>
        </RevealItem>
        <RevealItem>
          <AdminCard>
            <p className="text-xs font-medium text-admin-muted">순매출</p>
            <p className="mt-1.5 text-xl font-semibold text-admin-text">{amountText(netRevenue)}</p>
          </AdminCard>
        </RevealItem>
      </RevealGroup>

      <div className="px-8 pt-5">
        {days.length === 0 ? (
          <AdminCard className="p-0">
            <AdminEmptyState
              icon={<IconCalendar className="h-6 w-6" />}
              title={isCustomRange ? "이 기간 거래 내역이 없습니다." : "이번 달 거래 내역이 없습니다."}
            />
          </AdminCard>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-admin-border bg-admin-surface">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-admin-border text-left text-[11px] font-medium uppercase tracking-wider text-admin-muted">
                  <th className="w-20 px-4 py-2.5 font-medium">시각</th>
                  <th className="px-4 py-2.5 font-medium">내용</th>
                  <th className="px-4 py-2.5 font-medium">고객</th>
                  <th className="w-24 px-4 py-2.5 font-medium">유형</th>
                  <th className="w-20 px-4 py-2.5 font-medium">구분</th>
                  <th className="w-40 px-4 py-2.5 text-right font-medium">금액</th>
                </tr>
              </thead>
              {days.map((group) => {
                const dayRevenue = group.entries
                  .filter((e) => e.type === "REVENUE")
                  .reduce((sum, e) => sum + e.amount, 0);
                const dayRefund = group.entries
                  .filter((e) => e.type === "REFUND")
                  .reduce((sum, e) => sum + Math.abs(e.amount), 0);
                const isToday = group.date.toDateString() === today.toDateString();

                return (
                  <tbody key={group.date.toDateString()} className="border-b border-admin-border last:border-0">
                    <tr className="bg-admin-content/70">
                      <td colSpan={5} className="px-4 py-2 text-xs font-semibold text-admin-muted">
                        {DAY_HEADER_FORMAT.format(group.date)}
                        {isToday && (
                          <span className="ml-1.5 rounded bg-admin-blue px-1.5 py-0.5 text-[10px] font-semibold text-admin-bg">
                            오늘
                          </span>
                        )}
                        <span className="ml-2 font-normal text-admin-muted/70">
                          {group.entries.length}건
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-xs font-semibold tabular-nums">
                        {dayRevenue > 0 && <span className="text-admin-text">+{amountText(dayRevenue)}</span>}
                        {dayRefund > 0 && <span className="ml-2 text-admin-red">-{amountText(dayRefund)}</span>}
                      </td>
                    </tr>
                    {[...group.entries].reverse().map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-t border-admin-border/50 transition-colors hover:bg-admin-content/50"
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-admin-muted tabular-nums">
                          {TIME_FORMAT.format(entry.date)}
                        </td>
                        <td className="max-w-0 truncate px-4 py-2.5 font-medium text-admin-text">
                          {entry.title}
                        </td>
                        <td className="max-w-0 truncate px-4 py-2.5 text-admin-muted">
                          {entry.customerName}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={
                              "inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium " +
                              (entry.customerType === "BUSINESS"
                                ? "bg-admin-blue-soft text-admin-blue"
                                : "bg-admin-bg-soft text-admin-muted")
                            }
                          >
                            {CUSTOMER_TYPE_LABEL[entry.customerType]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={
                              "inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium " +
                              (entry.type === "REVENUE"
                                ? "bg-admin-bg-soft text-admin-text"
                                : "bg-admin-red-soft text-admin-red")
                            }
                          >
                            {entry.type === "REVENUE" ? "수입" : "환불"}
                          </span>
                        </td>
                        <td
                          className={
                            "px-4 py-2.5 text-right font-semibold tabular-nums " +
                            (entry.type === "REVENUE" ? "text-admin-text" : "text-admin-red")
                          }
                        >
                          {entry.type === "REVENUE" ? "+" : ""}
                          {amountText(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                );
              })}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
