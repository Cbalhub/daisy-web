import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { Segmented } from "@/components/admin/ui/Segmented";
import { SearchBox } from "@/components/admin/ui/SearchBox";
import { DateRangeFilter } from "@/components/admin/ui/DateRangeFilter";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { IconCard } from "@/components/admin/icons";
import { ORDER_STATUS_LABEL, PROJECT_STAGE_LABEL } from "@/lib/admin/status";
import { timeAgo } from "@/lib/utils";
import type { OrderStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const FILTERS: { label: string; status?: OrderStatus }[] = [
  { label: "전체" },
  { label: "결제 대기", status: "PENDING" },
  { label: "입금 확인 필요", status: "PAYMENT_CLAIMED" },
  { label: "결제 완료", status: "PAID" },
  { label: "취소/환불", status: "CANCELLED" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string }>;
}) {
  const { status, q, from, to } = await searchParams;
  const query = q?.trim();
  const activeHref = status ? `/admin/orders?status=${status}` : "/admin/orders";

  // "to" 날짜는 하루의 끝(23:59:59.999)까지 포함해야, 선택한 날짜 안에 생성된
  // 주문이 자정 기준으로 빠지는 일이 없습니다.
  const fromDate = from ? new Date(`${from}T00:00:00`) : undefined;
  const toDate = to ? new Date(`${to}T23:59:59.999`) : undefined;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status: status as OrderStatus } : {}),
    ...(fromDate || toDate
      ? { createdAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
      : {}),
    ...(query
      ? {
          OR: [
            { invoiceNumber: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
            { customerName: { contains: query, mode: "insensitive" } },
            { customerEmail: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="주문 · 결제"
        description="발행된 결제 요청과 진행 상태를 확인합니다."
        action={
          <Link
            href="/admin/orders/new"
            className="rounded-lg bg-admin-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            새 주문 만들기
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4 px-8 pt-6">
        <Segmented
          active={activeHref}
          items={FILTERS.map((f) => ({
            label: f.label,
            href: f.status ? `/admin/orders?status=${f.status}` : "/admin/orders",
          }))}
        />
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter />
          <SearchBox placeholder="주문번호, 제목, 고객명, 이메일로 검색" />
        </div>
      </div>

      <div className="px-8 pt-4">
        <AdminCard className="p-0">
          {orders.length === 0 ? (
            <AdminEmptyState
              icon={<IconCard className="h-6 w-6" />}
              title={query ? `"${query}"에 해당하는 주문이 없습니다.` : "해당 조건의 주문이 없습니다."}
              description={query ? undefined : "채팅에서 결제 요청을 보내거나 새 주문을 만들어 보세요."}
            />
          ) : (
            <RevealGroup as="ul" className="divide-y divide-admin-border" stagger={0.04}>
              {orders.map((order) => (
                <RevealItem key={order.id} as="li">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-admin-content"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-admin-muted">{order.invoiceNumber}</p>
                      <p className="mt-0.5 truncate font-medium text-admin-text">
                        {order.title}
                      </p>
                      <p className="mt-0.5 text-xs text-admin-muted">
                        {order.customerName} · {order.customerEmail}
                        {order.status === "PAYMENT_CLAIMED" && (
                          <span className="text-admin-amber"> · {timeAgo(order.updatedAt)} 입금 확인 요청</span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <p className="font-medium text-admin-text">
                        ₩{order.amount.toLocaleString("ko-KR")}
                      </p>
                      {order.status === "PAID" && (
                        <AdminBadge tone={PROJECT_STAGE_LABEL[order.progressStage].tone}>
                          {PROJECT_STAGE_LABEL[order.progressStage].label}
                        </AdminBadge>
                      )}
                      <AdminBadge tone={ORDER_STATUS_LABEL[order.status].tone}>
                        {ORDER_STATUS_LABEL[order.status].label}
                      </AdminBadge>
                    </div>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
