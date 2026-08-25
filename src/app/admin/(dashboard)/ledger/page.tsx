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
            <p className="mt-2 text-2xl font-semibold text-admin-blue">{amountText(totalRevenue)}</p>
          </AdminCard>
        </RevealItem>
        <RevealItem>
          <AdminCard>
            <p className="text-xs font-medium text-admin-muted">
              {isCustomRange ? "기간 내 환불" : "이번 달 환불"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-admin-red">
              {totalRefund > 0 ? `-${amountText(totalRefund)}` : amountText(0)}
            </p>
          </AdminCard>
        </RevealItem>
        <RevealItem>
          <AdminCard>
            <p className="text-xs font-medium text-admin-muted">순매출</p>
            <p className="mt-2 text-2xl font-semibold text-admin-text">{amountText(netRevenue)}</p>
          </AdminCard>
        </RevealItem>
      </RevealGroup>

      <div className="px-8 pt-4">
        <AdminCard className="p-0">
          {days.length === 0 ? (
            <AdminEmptyState
              icon={<IconCalendar className="h-6 w-6" />}
              title="이번 달 거래 내역이 없습니다."
            />
          ) : (
            <RevealGroup as="div" className="divide-y divide-admin-border" stagger={0.04}>
              {days.map((group) => {
                const dayRevenue = group.entries
                  .filter((e) => e.type === "REVENUE")
                  .reduce((sum, e) => sum + e.amount, 0);
                const dayRefund = group.entries
                  .filter((e) => e.type === "REFUND")
                  .reduce((sum, e) => sum + Math.abs(e.amount), 0);
                const isToday = group.date.toDateString() === today.toDateString();

                return (
                  <RevealItem key={group.date.toDateString()} as="div">
                    <div className="flex items-center justify-between gap-4 bg-admin-content px-5 py-2.5">
                      <p className="flex items-center gap-2 text-xs font-semibold text-admin-muted">
                        {DAY_HEADER_FORMAT.format(group.date)}
                        {isToday && (
                          <span className="rounded-full bg-admin-blue px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            오늘
                          </span>
                        )}
                      </p>
                      <p className="flex items-center gap-2 text-xs font-semibold tabular-nums">
                        {dayRevenue > 0 && <span className="text-admin-blue">+{amountText(dayRevenue)}</span>}
                        {dayRefund > 0 && <span className="text-admin-red">-{amountText(dayRefund)}</span>}
                      </p>
                    </div>
                    <ul className="divide-y divide-admin-border">
                      {[...group.entries].reverse().map((entry) => (
                        <li key={entry.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-admin-text">{entry.title}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-admin-muted">
                              <span className="truncate">
                                {entry.customerName} · {TIME_FORMAT.format(entry.date)}
                              </span>
                              <span
                                className={
                                  entry.customerType === "BUSINESS"
                                    ? "shrink-0 rounded-full bg-admin-blue-soft px-1.5 py-0.5 text-[10px] font-medium text-admin-blue"
                                    : "shrink-0 rounded-full bg-admin-bg-soft px-1.5 py-0.5 text-[10px] font-medium text-admin-muted"
                                }
                              >
                                {CUSTOMER_TYPE_LABEL[entry.customerType]}
                              </span>
                            </p>
                          </div>
                          <p
                            className={
                              entry.type === "REVENUE"
                                ? "shrink-0 text-sm font-semibold text-admin-blue"
                                : "shrink-0 text-sm font-semibold text-admin-red"
                            }
                          >
                            {entry.type === "REVENUE" ? "+" : ""}
                            {amountText(entry.amount)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
