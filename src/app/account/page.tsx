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
        include: { review: { select: { id: true } } },
      },
    },
  });
  if (!customer) redirect("/account/login");

  const paidOrders = customer.orders.filter((o) => o.status === "PAID");
  const inProgress = paidOrders.filter((o) => o.progressStage !== "DELIVERED").length;
  const totalPaid = paidOrders.reduce((sum, o) => sum + o.amount, 0);
  const displayName = customer.name || customer.email;
  const initial = displayName.trim().charAt(0).toUpperCase();

  const STATS = [
    { label: "전체 프로젝트", value: `${customer.orders.length}건` },
    { label: "진행중", value: `${inProgress}건` },
    { label: "누적 결제 금액", value: `₩${totalPaid.toLocaleString("ko-KR")}` },
  ];

  return (
    <section className="pt-20 pb-24 md:pt-28">
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-base font-semibold text-paper">
              {initial}
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
                마이페이지
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-balance md:text-3xl">
                {customer.name ? `${customer.name}님` : customer.email}
              </h1>
              <p className="mt-0.5 text-sm text-muted">{customer.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-10 grid grid-cols-3 divide-x divide-line border-y border-line">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-4 py-5 first:pl-0">
              <p className="text-xs font-medium text-muted">{stat.label}</p>
              <p className="mt-2 font-display text-xl font-bold tracking-tight tabular-nums md:text-2xl">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <h2 className="font-display text-lg font-bold">주문 · 결제 내역</h2>
          {customer.orders.length === 0 ? (
            <div className="mt-8 text-center">
              <Mark variant="mono" className="mx-auto h-12 w-12 text-accent/60" />
              <p className="mt-4 text-sm text-muted">
                아직 주문 내역이 없습니다. 문의를 남기면 견적부터 도와드려요.
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
