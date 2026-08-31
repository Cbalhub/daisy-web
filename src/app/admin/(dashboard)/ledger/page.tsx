import Link from "next/link";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { Segmented } from "@/components/admin/ui/Segmented";
import { DateRangeFilter } from "@/components/admin/ui/DateRangeFilter";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { IconCalendar, IconChevronLeft, IconChevronRight, IconDownload } from "@/components/admin/icons";
import { PROJECT_STAGE_LABEL } from "@/lib/admin/status";
import {
  getMonthlyLedger,
  getLedgerEntries,
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

// 노션 데이터베이스 태그 색 (라이트) — 관리자는 라이트 고정이라 그대로 씁니다.
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

// 노션 헤더의 속성 타입 아이콘 흉내
function Th({
  kind,
  label,
  right,
}: {
  kind: "text" | "num" | "date" | "select";
  label: string;
  right?: boolean;
}) {
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

  const isCustomRange = Boolean(from && to);
  const rangeStart = from ? new Date(`${from}T00:00:00`) : undefined;
  const rangeEnd = to ? new Date(`${to}T00:00:00`) : undefined;
  if (rangeEnd) rangeEnd.setDate(rangeEnd.getDate() + 1);

  const { entries, totalRevenue, totalRefund, netRevenue } =
    isCustomRange && rangeStart && rangeEnd
      ? await getLedgerEntries(rangeStart, rangeEnd, customerType)
      : await getMonthlyLedger(year, month, customerType);
  const rows = [...entries].reverse(); // 최신 결제가 위로

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
      <AdminPageHeader title="장부" description="결제·환불 내역. 노션 결제 내역 DB와 같은 구성입니다." />

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
            <p className="mt-1.5 text-xl font-semibold text-admin-text">{amountText(totalRevenue)}</p>
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
        {rows.length === 0 ? (
          <AdminCard className="p-0">
            <AdminEmptyState
              icon={<IconCalendar className="h-6 w-6" />}
              title={isCustomRange ? "이 기간 거래 내역이 없습니다." : "이번 달 거래 내역이 없습니다."}
            />
          </AdminCard>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-admin-border bg-admin-surface">
            <table className="w-full min-w-[74rem] border-collapse text-[13px] text-admin-text">
              <thead>
                <tr className="border-b border-admin-border text-admin-muted">
                  <Th kind="date" label="결제일" />
                  <Th kind="text" label="발주처 / 고객명" />
                  <Th kind="text" label="외주 프로젝트명" />
                  <Th kind="text" label="상세 기능" />
                  <Th kind="num" label="금액(KRW)" right />
                  <Th kind="select" label="결제 방식" />
                  <Th kind="select" label="구분" />
                  <Th kind="select" label="진행 상태" />
                  <Th kind="select" label="유형" />
                  <Th kind="text" label="사업자등록번호" />
                  <Th kind="text" label="연락처" />
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const stage = PROJECT_STAGE_LABEL[e.progressStage];
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-admin-border/60 transition-colors last:border-0 hover:bg-admin-content/50"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-admin-muted tabular-nums">
                        {DATE_FORMAT.format(e.date)}
                      </td>
                      <td className="px-3 py-2 font-medium">{e.customerName}</td>
                      <td className="max-w-[16rem] truncate px-3 py-2">{e.title}</td>
                      <td className="max-w-[18rem] truncate px-3 py-2 text-admin-muted">
                        {e.detail || "–"}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums ${
                          e.type === "REVENUE" ? "" : "text-admin-red"
                        }`}
                      >
                        {e.type === "REVENUE" ? "" : "-"}
                        {amountText(Math.abs(e.amount))}
                      </td>
                      <td className="px-3 py-2">
                        <Pill tone="green">계좌이체</Pill>
                      </td>
                      <td className="px-3 py-2">
                        <Pill tone={e.type === "REVENUE" ? "neutral" : "red"}>
                          {e.type === "REVENUE" ? "결제" : "환불"}
                        </Pill>
                      </td>
                      <td className="px-3 py-2">
                        <Pill tone={stage.tone}>{stage.label}</Pill>
                      </td>
                      <td className="px-3 py-2">
                        <Pill tone={e.customerType === "BUSINESS" ? "blue" : "neutral"}>
                          {CUSTOMER_TYPE_LABEL[e.customerType]}
                        </Pill>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-admin-muted tabular-nums">
                        {e.businessRegNo || "–"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-admin-muted tabular-nums">
                        {e.phone || "–"}
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
