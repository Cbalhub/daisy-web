import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { LogoutButton } from "@/components/account/LogoutButton";
import { OrderList } from "@/components/account/OrderList";
import { DaisyAsterisk } from "@/components/marketing/DaisyAsterisk";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { requireCustomerSession } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "마이페이지" };
export const dynamic = "force-dynamic";

// 홈페이지 Stats/PROCESS와 같은 꽃잎 색 순서 — 마이페이지도 같은 브랜드 언어를 씁니다.
const PETAL_COLORS = [
  "var(--color-petal-yellow)",
  "var(--color-petal-pink)",
  "var(--color-petal-purple)",
];

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
            <Reveal>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-semibold text-paper">
                {initial}
              </div>
            </Reveal>
            <div>
              <Reveal delay={0.04}>
                <p className="text-xs font-semibold tracking-[0.05em] text-accent">
                  마이페이지
                </p>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-balance md:text-3xl">
                  {customer.name ? `${customer.name}님` : customer.email}
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-0.5 text-sm text-muted">{customer.email}</p>
              </Reveal>
            </div>
          </div>
          <Reveal delay={0.1}>
            <LogoutButton />
          </Reveal>
        </div>

        <RevealGroup className="mt-10 grid grid-cols-3 gap-4" stagger={0.05}>
          {STATS.map((stat, i) => (
            <RevealItem key={stat.label}>
              <div className="rounded-2xl bg-paper-dim px-5 py-5">
                <span
                  className="mb-2.5 block h-1 w-6 rounded-full"
                  style={{ background: PETAL_COLORS[i % PETAL_COLORS.length] }}
                />
                <p className="text-xs font-medium text-muted">{stat.label}</p>
                <p className="mt-1.5 font-display text-xl font-semibold tracking-tight tabular-nums md:text-2xl">
                  {stat.value}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-14">
          <Reveal delay={0.14}>
            <h2 className="font-display text-xl">주문 · 결제 내역</h2>
          </Reveal>
          {customer.orders.length === 0 ? (
            <Reveal delay={0.18}>
              <div className="mt-8 text-center">
                <DaisyAsterisk variant="mono" className="mx-auto h-14 w-14 text-accent/70" />
                <p className="mt-4 text-sm text-muted">
                  아직 주문 내역이 없습니다. 문의를 남기면 견적부터 도와드려요.
                </p>
                <OpenChatButton size="md" className="mt-5">
                  프로젝트 문의하기
                </OpenChatButton>
              </div>
            </Reveal>
          ) : (
            <OrderList orders={customer.orders} />
          )}
        </div>
      </Container>
    </section>
  );
}
