import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { SearchBox } from "@/components/admin/ui/SearchBox";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { IconUsers } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const customers = await prisma.customer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true, inquiries: true } } },
  });

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="고객"
        description={`가입한 고객 계정 ${customers.length}명입니다.`}
      />

      <div className="px-4 sm:px-8 pt-6">
        <SearchBox placeholder="이름, 이메일, 연락처로 검색" />
      </div>

      <div className="px-4 sm:px-8 pt-4">
        <AdminCard className="p-0">
          {customers.length === 0 ? (
            <AdminEmptyState
              icon={<IconUsers className="h-6 w-6" />}
              title={query ? `"${query}"에 해당하는 고객이 없습니다.` : "아직 가입한 고객이 없습니다."}
              description={query ? undefined : "고객이 회원가입하면 여기에 표시돼요."}
            />
          ) : (
            <RevealGroup as="ul" className="divide-y divide-admin-border" stagger={0.04}>
              {customers.map((customer) => (
                <RevealItem key={customer.id} as="li">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-admin-content"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-admin-text">
                        {customer.name || customer.email}
                      </p>
                      <p className="mt-0.5 text-xs text-admin-muted">
                        {customer.email}
                        {customer.phone ? ` · ${customer.phone}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-xs text-admin-muted">
                      <span>주문 {customer._count.orders}건</span>
                      <span>문의 {customer._count.inquiries}건</span>
                      <span>
                        {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(
                          customer.createdAt
                        )}{" "}
                        가입
                      </span>
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
