import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { LogoutButton } from "@/components/account/LogoutButton";
import { OrderList } from "@/components/account/OrderList";
import { Mark } from "@/components/brand/Mark";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { requireCustomerSession } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "마이페이지" };
export const dynamic = "force-dynamic";

export default async function AccountDashboardPage() {
  const session = await requireCustomerSession();
  if (!session?.customerId) redirect("/account/login");

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          review: { select: { id: true } },
          contracts: {
            where: { status: { not: "VOID" } },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { token: true, status: true },
          },
        },
      },
    },
  });
  if (!customer) redirect("/account/login");

  const paidOrders = customer.orders.filter((o) => o.status === "PAID");
  const inProgress = paidOrders.filter((o) => o.progressStage !== "DELIVERED").length;
  const totalPaid = paidOrders.reduce((sum, o) => sum + o.amount, 0);
  const needsAction = customer.orders.filter(
    (o) =>
      o.status === "DRAFT" ||
      o.status === "PENDING" ||
      o.contracts[0]?.status === "SENT"
  ).length;

  const stats = [
    { label: "전체 프로젝트", value: `${customer.orders.length}` },
    { label: "진행 중", value: `${inProgress}` },
    { label: "확인 필요", value: `${needsAction}` },
    { label: "누적 결제", value: `₩${totalPaid.toLocaleString("ko-KR")}` },
  ];

  return (
    <section className="pt-16 pb-24 md:pt-20">
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">
              {customer.name ? `${customer.name} 님` : "내 프로젝트"}
            </h1>
            <p className="mt-1 text-sm text-muted">{customer.email}</p>
          </div>
          <LogoutButton />
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-y border-line py-5 sm:flex sm:flex-wrap sm:gap-x-12">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs text-muted">{stat.label}</dt>
              <dd className="mt-1 font-display text-xl font-extrabold tracking-tight tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12">
          <h2 className="text-sm font-semibold text-ink">주문 · 프로젝트</h2>
          {customer.orders.length === 0 ? (
            <div className="mt-10 flex flex-col items-center rounded-xl border border-line bg-paper-dim py-14 text-center">
              <Mark variant="mono" className="h-10 w-10 text-muted" />
              <p className="mt-4 text-sm text-muted">
                아직 주문 내역이 없어요. 문의를 남기면 견적부터 도와드립니다.
              </p>
              <OpenChatButton size="md" className="mt-5">
                프로젝트 문의하기
              </OpenChatButton>
            </div>
          ) : (
            <OrderList orders={customer.orders} />
          )}
        </div>
      </Container>
    </section>
  );
}
