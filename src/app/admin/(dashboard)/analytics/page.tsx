import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { Sparkline } from "@/components/admin/ui/Sparkline";
import { getFunnelOverview, getChannelBreakdown } from "@/lib/admin/funnel";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [{ funnel, exitPages, dailyPageViews, windowDays }, channels] = await Promise.all([
    getFunnelOverview(),
    getChannelBreakdown(),
  ]);
  const topOfFunnel = funnel[0]?.count || 1;

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="분석"
        description={`최근 ${windowDays}일 동안의 방문 → 문의 → 결제 퍼널과 이탈 페이지입니다.`}
      />

      <div className="px-4 sm:px-8 pt-6">
        <AdminCard>
          <h2 className="text-sm font-semibold text-admin-text">일별 방문(세션) 추이</h2>
          <div className="mt-6">
            <Sparkline data={dailyPageViews} />
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-4 px-4 sm:px-8 pt-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="text-sm font-semibold text-admin-text">전환 퍼널</h2>
          <div className="mt-5 space-y-4">
            {funnel.map((step, i) => {
              const prev = i === 0 ? step.count : funnel[i - 1].count;
              const dropRate = prev > 0 ? Math.round((1 - step.count / prev) * 100) : 0;
              const widthPct = Math.max(4, (step.count / topOfFunnel) * 100);
              return (
                <div key={step.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-admin-text">{step.label}</span>
                    <span className="text-admin-muted">
                      {step.count.toLocaleString("ko-KR")}
                      {i > 0 && (
                        <span className="ml-2 text-admin-red">이탈 {dropRate}%</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-admin-content">
                    <div
                      className="h-2 rounded-full bg-admin-blue transition-all duration-500 ease-out"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-sm font-semibold text-admin-text">이탈이 많은 페이지</h2>
          <p className="mt-1 text-xs text-admin-muted">
            세션에서 마지막으로 조회된 페이지 기준입니다.
          </p>
          <ul className="mt-4 space-y-2.5">
            {exitPages.length === 0 && (
              <p className="py-8 text-center text-sm text-admin-muted">데이터가 아직 없습니다.</p>
            )}
            {exitPages.map((p) => (
              <li key={p.path} className="flex items-center justify-between text-sm">
                <span className="truncate text-admin-text">{p.path}</span>
                <span className="shrink-0 text-admin-muted">{p.count}회</span>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      <div className="px-4 sm:px-8 pt-4">
        <AdminCard>
          <h2 className="text-sm font-semibold text-admin-text">유입 채널</h2>
          <p className="mt-1 text-xs text-admin-muted">
            세션의 첫 방문 기준(utm_source 우선, 없으면 리퍼러). 최근 {windowDays}일.
          </p>
          {channels.length === 0 ? (
            <p className="py-8 text-center text-sm text-admin-muted">데이터가 아직 없습니다.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-xs text-admin-muted">
                    <th className="py-2 text-left font-medium">채널</th>
                    <th className="py-2 text-right font-medium">방문</th>
                    <th className="py-2 text-right font-medium">문의</th>
                    <th className="py-2 text-right font-medium">결제</th>
                    <th className="py-2 text-right font-medium">문의 전환</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((c) => (
                    <tr key={c.channel} className="border-b border-admin-border/60 last:border-0">
                      <td className="py-2 font-medium text-admin-text">{c.channel}</td>
                      <td className="py-2 text-right tabular-nums text-admin-text">
                        {c.visits.toLocaleString("ko-KR")}
                      </td>
                      <td className="py-2 text-right tabular-nums text-admin-text">{c.inquiries}</td>
                      <td className="py-2 text-right tabular-nums text-admin-text">{c.checkouts}</td>
                      <td className="py-2 text-right tabular-nums text-admin-muted">
                        {c.visits > 0 ? `${Math.round((c.inquiries / c.visits) * 100)}%` : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
