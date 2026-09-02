import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { CountUp } from "@/components/admin/ui/CountUp";
import { Sparkline } from "@/components/admin/ui/Sparkline";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { IconChat, IconCard } from "@/components/admin/icons";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { ORDER_STATUS_LABEL } from "@/lib/admin/status";
import { getDailyRevenue, getDailyConversations } from "@/lib/admin/revenue";
import { decryptFieldTagged } from "@/lib/crypto";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getOverview() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  const [
    newConversations,
    paidThisMonth,
    paidLastMonth,
    pendingOrders,
    claimedOrders,
    unreadMessages,
    newCustomers,
    stageReceived,
    stageInProgress,
    stageDelivered,
    refundThisMonth,
    recentConversations,
    recentOrders,
    dailyRevenue,
    dailyConversations,
    sentContracts,
    stalePendingOrders,
    unpublishedReviews,
    newInquiries,
  ] = await Promise.all([
    prisma.chatConversation.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({
      where: { status: "PAID", approvedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", approvedAt: { gte: startOfLastMonth, lt: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "PAYMENT_CLAIMED" } }),
    prisma.chatMessage.count({ where: { sender: "VISITOR", read: false } }),
    prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({ where: { status: "PAID", progressStage: "RECEIVED" } }),
    prisma.order.count({ where: { status: "PAID", progressStage: "IN_PROGRESS" } }),
    prisma.order.count({ where: { status: "PAID", progressStage: "DELIVERED" } }),
    prisma.refund.aggregate({
      where: { cancelledAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.chatConversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 5,
      include: {
        customer: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    getDailyRevenue(),
    getDailyConversations(),
    prisma.contract.count({ where: { status: "SENT" } }),
    prisma.order.count({
      where: {
        status: "PENDING",
        createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.review.count({ where: { publishedAt: null, orderId: { not: null } } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
  ]);

  return {
    newConversations,
    paidThisMonth: paidThisMonth._sum.amount ?? 0,
    paidLastMonth: paidLastMonth._sum.amount ?? 0,
    pendingOrders,
    claimedOrders,
    unreadMessages,
    newCustomers,
    stageReceived,
    stageInProgress,
    stageDelivered,
    refundThisMonth: refundThisMonth._sum.amount ?? 0,
    recentConversations,
    recentOrders,
    dailyRevenue,
    dailyConversations,
    sentContracts,
    stalePendingOrders,
    unpublishedReviews,
    newInquiries,
  };
}

export default async function AdminDashboardPage() {
  const {
    newConversations,
    paidThisMonth,
    paidLastMonth,
    pendingOrders,
    claimedOrders,
    unreadMessages,
    newCustomers,
    stageReceived,
    stageInProgress,
    stageDelivered,
    refundThisMonth,
    recentConversations,
    recentOrders,
    dailyRevenue,
    dailyConversations,
    sentContracts,
    stalePendingOrders,
    unpublishedReviews,
    newInquiries,
  } = await getOverview();

  const hasConversationTrend = dailyConversations.some((d) => d.value > 0);

  const totalActive = stageReceived + stageInProgress + stageDelivered;
  const STAGE_BREAKDOWN = [
    { label: "작업 시작", count: stageReceived, tone: "neutral" as const },
    { label: "작업 중", count: stageInProgress, tone: "blue" as const },
    { label: "전달완료", count: stageDelivered, tone: "green" as const },
  ];
  const STAGE_BAR_COLOR: Record<"neutral" | "blue" | "green", string> = {
    neutral: "bg-admin-muted/40",
    blue: "bg-admin-blue",
    green: "bg-admin-green",
  };
  const STAGE_DOT_COLOR: Record<"neutral" | "blue" | "green", string> = {
    neutral: "bg-admin-muted",
    blue: "bg-admin-blue",
    green: "bg-admin-green",
  };

  const monthLabel = new Intl.DateTimeFormat("ko-KR", { month: "long" }).format(new Date());
  const momChange = paidLastMonth > 0 ? Math.round(((paidThisMonth - paidLastMonth) / paidLastMonth) * 100) : null;
  const hasRevenueTrend = dailyRevenue.some((d) => d.value > 0);

  return (
    <div className="pb-16">
      <AdminPageHeader title="대시보드" description="오늘의 채팅과 결제 현황입니다." />

      <div className="px-4 sm:px-8 pt-6">
        <Reveal>
          {unreadMessages > 0 ||
          claimedOrders > 0 ||
          sentContracts > 0 ||
          stalePendingOrders > 0 ||
          unpublishedReviews > 0 ||
          newInquiries > 0 ? (
            <AdminCard className="flex flex-wrap items-center gap-3 border border-admin-blue/20 bg-admin-blue-soft p-4">
              <p className="text-sm font-semibold text-admin-blue">지금 확인할 게 있어요</p>
              <div className="flex flex-wrap gap-2">
                {newInquiries > 0 && (
                  <Link
                    href="/admin/inquiries?status=NEW"
                    className="flex items-center gap-1.5 rounded-full bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-text transition-colors hover:bg-white"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-admin-blue" />
                    새 문의 {newInquiries}건
                  </Link>
                )}
                {unreadMessages > 0 && (
                  <Link
                    href="/admin/chats"
                    className="flex items-center gap-1.5 rounded-full bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-text transition-colors hover:bg-white"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-admin-blue" />
                    안읽은 채팅 {unreadMessages}건
                  </Link>
                )}
                {claimedOrders > 0 && (
                  <Link
                    href="/admin/orders?status=PAYMENT_CLAIMED"
                    className="flex items-center gap-1.5 rounded-full bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-text transition-colors hover:bg-white"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-admin-amber" />
                    입금 확인 대기 {claimedOrders}건
                  </Link>
                )}
                {sentContracts > 0 && (
                  <Link
                    href="/admin/orders"
                    className="flex items-center gap-1.5 rounded-full bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-text transition-colors hover:bg-white"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-admin-blue" />
                    서명 대기 계약 {sentContracts}건
                  </Link>
                )}
                {stalePendingOrders > 0 && (
                  <Link
                    href="/admin/orders?status=PENDING"
                    className="flex items-center gap-1.5 rounded-full bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-text transition-colors hover:bg-white"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-admin-amber" />
                    7일+ 미결제 주문 {stalePendingOrders}건
                  </Link>
                )}
                {unpublishedReviews > 0 && (
                  <Link
                    href="/admin/reviews"
                    className="flex items-center gap-1.5 rounded-full bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-text transition-colors hover:bg-white"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-admin-green" />
                    미게시 후기 {unpublishedReviews}건
                  </Link>
                )}
              </div>
            </AdminCard>
          ) : (
            <AdminCard className="flex items-center gap-2.5 p-4 text-sm text-admin-muted">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-admin-green" />
              오늘 처리할 새 알림이 없어요.
            </AdminCard>
          )}
        </Reveal>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 sm:px-8 pt-4 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <AdminCard className="flex h-full flex-col p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-admin-muted">{monthLabel} 결제 완료 금액</p>
                <CountUp
                  value={paidThisMonth}
                  prefix="₩"
                  className="mt-2 block text-4xl font-semibold tracking-tight text-admin-text tabular-nums md:text-5xl"
                />
              </div>
              {momChange !== null && (
                <span
                  className={
                    momChange >= 0
                      ? "shrink-0 rounded-full bg-admin-green-soft px-2.5 py-1 text-xs font-semibold text-admin-green"
                      : "shrink-0 rounded-full bg-admin-red-soft px-2.5 py-1 text-xs font-semibold text-admin-red"
                  }
                >
                  {momChange >= 0 ? "▲" : "▼"} {Math.abs(momChange)}%
                  <span className="ml-1 font-normal text-admin-muted">전월 대비</span>
                </span>
              )}
            </div>
            {hasRevenueTrend ? (
              <>
                <div className="mt-6 flex-1">
                  <Sparkline data={dailyRevenue} prefix="₩" />
                </div>
                <p className="mt-1 text-[11px] text-admin-muted">최근 14일간 결제완료 금액입니다.</p>
              </>
            ) : (
              <div className="mt-6 flex flex-1 items-center justify-center rounded-xl bg-admin-content py-8">
                <p className="text-xs text-admin-muted">최근 14일간 결제완료 내역이 없습니다.</p>
              </div>
            )}
          </AdminCard>
        </Reveal>

        <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:flex lg:h-full lg:flex-col" stagger={0.06}>
          <RevealItem className="lg:flex-1">
            <AdminCard className="flex h-full flex-col justify-center p-5">
              <p className="text-xs font-medium text-admin-muted">이번 달 신규 대화</p>
              <CountUp
                value={newConversations}
                suffix="건"
                className="mt-2 block text-2xl font-semibold text-admin-text tabular-nums"
              />
            </AdminCard>
          </RevealItem>
          <RevealItem className="lg:flex-1">
            <AdminCard className="flex h-full flex-col justify-center p-5">
              <p className="text-xs font-medium text-admin-muted">결제 대기 중인 주문</p>
              <CountUp
                value={pendingOrders}
                suffix="건"
                className="mt-2 block text-2xl font-semibold text-admin-text tabular-nums"
              />
            </AdminCard>
          </RevealItem>
          <RevealItem className="lg:flex-1">
            <Link href="/admin/orders?status=PAYMENT_CLAIMED" className="block h-full">
              <AdminCard
                className={cn(
                  "flex h-full flex-col justify-center p-5 transition-colors",
                  claimedOrders > 0 && "bg-admin-amber-soft"
                )}
              >
                <p className={cn("text-xs font-medium", claimedOrders > 0 ? "text-admin-amber" : "text-admin-muted")}>
                  입금 확인 필요
                </p>
                <CountUp
                  value={claimedOrders}
                  suffix="건"
                  className={cn(
                    "mt-2 block text-2xl font-semibold tabular-nums",
                    claimedOrders > 0 ? "text-admin-amber" : "text-admin-text"
                  )}
                />
              </AdminCard>
            </Link>
          </RevealItem>
        </RevealGroup>
      </div>

      <div className="px-4 sm:px-8 pt-4">
        <Reveal delay={0.08}>
          <AdminCard className="p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-admin-muted">최근 14일 신규 문의(대화)</p>
                <CountUp
                  value={dailyConversations.reduce((sum, d) => sum + d.value, 0)}
                  suffix="건"
                  className="mt-2 block text-3xl font-semibold tracking-tight text-admin-text tabular-nums"
                />
              </div>
            </div>
            {hasConversationTrend ? (
              <div className="mt-6">
                <Sparkline data={dailyConversations} />
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-center rounded-xl bg-admin-content py-8">
                <p className="text-xs text-admin-muted">최근 14일간 새 문의가 없습니다.</p>
              </div>
            )}
          </AdminCard>
        </Reveal>
      </div>

      <RevealGroup className="grid grid-cols-2 gap-4 px-4 sm:px-8 pt-4 sm:grid-cols-3" stagger={0.05}>
        <RevealItem>
          <AdminCard className="p-5">
            <p className="text-xs font-medium text-admin-muted">진행중인 프로젝트</p>
            <CountUp
              value={stageInProgress}
              suffix="건"
              className="mt-2 block text-2xl font-semibold text-admin-text tabular-nums"
            />
          </AdminCard>
        </RevealItem>
        <RevealItem>
          <AdminCard className="p-5">
            <p className="text-xs font-medium text-admin-muted">이번 달 신규 고객</p>
            <CountUp
              value={newCustomers}
              suffix="명"
              className="mt-2 block text-2xl font-semibold text-admin-text tabular-nums"
            />
          </AdminCard>
        </RevealItem>
        <RevealItem>
          <AdminCard className="p-5">
            <p className="text-xs font-medium text-admin-muted">이번 달 환불</p>
            <CountUp
              value={refundThisMonth}
              prefix="₩"
              className="mt-2 block text-2xl font-semibold text-admin-text tabular-nums"
            />
          </AdminCard>
        </RevealItem>
      </RevealGroup>

      <div className="px-4 sm:px-8 pt-4">
        <Reveal delay={0.1}>
          <AdminCard>
            <h2 className="text-sm font-semibold text-admin-text">프로젝트 진행 현황</h2>
            {totalActive === 0 ? (
              <p className="mt-4 text-sm text-admin-muted">아직 결제완료된 프로젝트가 없습니다.</p>
            ) : (
              <>
                <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-admin-content">
                  {STAGE_BREAKDOWN.map((stage) => (
                    <div
                      key={stage.label}
                      className={STAGE_BAR_COLOR[stage.tone]}
                      style={{ width: `${(stage.count / totalActive) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  {STAGE_BREAKDOWN.map((stage) => (
                    <div key={stage.label} className="flex items-center gap-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${STAGE_DOT_COLOR[stage.tone]}`} />
                      <span className="text-admin-muted">{stage.label}</span>
                      <span className="font-semibold tabular-nums text-admin-text">
                        {stage.count}건
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </AdminCard>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 sm:px-8 pt-4 lg:grid-cols-2 lg:items-stretch">
        <Reveal delay={0.14} className="h-full">
        <AdminCard className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-admin-text">최근 대화</h2>
            <Link href="/admin/chats" className="text-xs text-admin-blue hover:underline">
              전체 보기
            </Link>
          </div>
          <ul className="mt-4 space-y-1">
            {recentConversations.length === 0 && (
              <AdminEmptyState icon={<IconChat className="h-5 w-5" />} title="아직 대화가 없습니다." />
            )}
            {recentConversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={`/admin/chats/${conversation.id}`}
                  className="flex items-center justify-between rounded-lg px-2.5 py-2.5 text-sm transition-colors hover:bg-admin-content"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-admin-text">
                      {conversation.customer.name || conversation.customer.email}
                    </span>
                    <span className="block truncate text-xs text-admin-muted">
                      {conversation.messages[0] ? decryptFieldTagged(conversation.messages[0].body) : "-"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>
        </Reveal>

        <Reveal delay={0.18} className="h-full">
        <AdminCard className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-admin-text">최근 주문</h2>
            <Link href="/admin/orders" className="text-xs text-admin-blue hover:underline">
              전체 보기
            </Link>
          </div>
          <ul className="mt-4 space-y-1">
            {recentOrders.length === 0 && (
              <AdminEmptyState icon={<IconCard className="h-5 w-5" />} title="아직 주문이 없습니다." />
            )}
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between rounded-lg px-2.5 py-2.5 text-sm transition-colors hover:bg-admin-content"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-admin-text">
                      {order.title}
                    </span>
                    <span className="block truncate text-xs text-admin-muted">
                      {order.customerName} · ₩{order.amount.toLocaleString("ko-KR")}
                    </span>
                  </span>
                  <AdminBadge tone={ORDER_STATUS_LABEL[order.status].tone}>
                    {ORDER_STATUS_LABEL[order.status].label}
                  </AdminBadge>
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>
        </Reveal>
      </div>
    </div>
  );
}
