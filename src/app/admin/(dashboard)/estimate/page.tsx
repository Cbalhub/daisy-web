import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { IconReceipt } from "@/components/admin/icons";
import { AddEstimate } from "@/components/admin/Estimate";

export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminEstimatePage() {
  const estimates = await prisma.estimate.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="견적"
        description="고객이 길게 적어 보낸 문의를 붙여넣으면 기능 그룹·항목으로 쪼개고 항목별 예상 작업일수를 추정합니다. 금액은 직접 넣고, 계약서 '용역 범위'로 바로 복사할 수 있어요."
      />

      <div className="px-4 pt-6 sm:px-8">
        <AddEstimate />
      </div>

      <div className="px-4 pt-6 sm:px-8">
        {estimates.length === 0 ? (
          <AdminCard className="p-0">
            <AdminEmptyState icon={<IconReceipt className="h-6 w-6" />} title="아직 견적이 없습니다." />
          </AdminCard>
        ) : (
          <ul className="space-y-2">
            {estimates.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/admin/estimate/${e.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-admin-border bg-admin-surface px-5 py-4 transition-colors hover:border-admin-blue"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-admin-text">
                      {e.projectName || "제목 없음"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-admin-muted">{e.summary}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-admin-muted">
                    <span className="font-medium tabular-nums text-admin-text">{e.totalDays}일</span>
                    {DATE_FORMAT.format(e.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
