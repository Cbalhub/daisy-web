import Link from "next/link";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, PROJECT_STAGE_LABEL, PROJECT_STAGE_ORDER } from "@/lib/admin/status";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import type { TimelineEvent } from "@/lib/order-timeline";
import type { Order, ProjectStage, ContractStatus } from "@prisma/client";

type OrderWithMeta = Order & {
  review: { id: string } | null;
  contracts: { token: string; status: ContractStatus }[];
};

const TONE_TEXT: Record<string, string> = {
  neutral: "bg-paper-dim text-muted",
  blue: "bg-accent-soft text-accent",
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  red: "bg-error-soft text-error",
};

export function OrderList({
  orders,
  timelines = {},
}: {
  orders: OrderWithMeta[];
  timelines?: Record<string, TimelineEvent[]>;
}) {
  return (
    <ul className="mt-5 space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} timeline={timelines[order.id] ?? []} />
      ))}
    </ul>
  );
}

function OrderCard({ order, timeline }: { order: OrderWithMeta; timeline: TimelineEvent[] }) {
  const isPaid = order.status === "PAID";
  const isPayable = order.status === "DRAFT" || order.status === "PENDING";
  const contract = order.contracts[0] ?? null;

  // 결제 완료 건은 아래 진행 트래커가 작업 단계를 보여주므로 상단 배지는 생략하고,
  // 그 외 상태(결제 대기·환불 등)만 배지로 표시합니다.
  const badge = isPaid ? null : ORDER_STATUS_LABEL[order.status];

  return (
    <li className="rounded-xl border border-line bg-paper p-5 shadow-[var(--shadow-e1)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink">{order.title}</p>
          <p className="mt-0.5 text-sm tabular-nums text-muted">
            ₩{order.amount.toLocaleString("ko-KR")}
          </p>
        </div>
        {badge && (
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
              TONE_TEXT[badge.tone]
            )}
          >
            {badge.label}
          </span>
        )}
      </div>

      {isPayable && (
        <Link
          href={`/pay/${order.orderToken}`}
          className="mt-4 inline-flex h-9 items-center justify-center whitespace-nowrap rounded-[10px] bg-accent px-4 text-sm font-semibold text-on-accent shadow-[var(--shadow-e1)] transition-all hover:bg-accent-bright hover:shadow-[var(--shadow-e2)] active:translate-y-px active:shadow-none"
        >
          결제하기 →
        </Link>
      )}

      {isPaid && <ProgressTracker stage={order.progressStage} />}

      {timeline.length > 1 && (
        <details className="mt-3 group">
          <summary className="cursor-pointer list-none text-xs font-medium text-accent hover:opacity-70">
            진행 상황 자세히 <span className="text-muted group-open:hidden">▾</span>
            <span className="hidden text-muted group-open:inline">▴</span>
          </summary>
          <OrderTimeline events={timeline} />
        </details>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <span className="mr-1 text-xs text-muted">문서</span>

        <DocLink href={`/api/pay/${order.orderToken}/quote`} newTab>
          견적서
        </DocLink>

        {contract && (
          <DocLink
            href={`/contract/${contract.token}`}
            emphasis={contract.status === "SENT"}
          >
            {contract.status === "SENT"
              ? "계약서 서명하기"
              : contract.status === "SIGNED"
                ? "계약서(서명본)"
                : "계약서"}
          </DocLink>
        )}

        {isPaid && (
          <>
            <DocLink href={`/pay/${order.orderToken}/receipt`}>영수증</DocLink>
            <DocLink href={`/pay/${order.orderToken}/confirmation`}>거래확인서</DocLink>
          </>
        )}

        {order.progressStage === "DELIVERED" && !order.review && (
          <Link
            href={`/review/${order.orderToken}`}
            className="ml-auto text-xs font-medium text-accent hover:opacity-70"
          >
            후기 남기기 →
          </Link>
        )}
      </div>
    </li>
  );
}

function DocLink({
  href,
  children,
  newTab,
  emphasis,
}: {
  href: string;
  children: React.ReactNode;
  newTab?: boolean;
  emphasis?: boolean;
}) {
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
        emphasis
          ? "border-ink bg-ink text-paper hover:bg-ink/90"
          : "border-line text-ink-soft hover:border-ink/30 hover:text-ink"
      )}
    >
      {children}
    </a>
  );
}

function ProgressTracker({ stage }: { stage: ProjectStage }) {
  const currentIndex = PROJECT_STAGE_ORDER.indexOf(stage);
  return (
    <div className="mt-4 flex items-center gap-2 rounded-xl bg-paper-dim px-4 py-4">
      {PROJECT_STAGE_ORDER.map((s, i) => {
        const done = i <= currentIndex;
        const lineFilled = i < currentIndex;
        return (
          <div key={s} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", done ? "bg-accent" : "bg-line")}
              />
              <span
                className={cn(
                  "text-[11px] whitespace-nowrap",
                  done ? "font-medium text-ink" : "text-muted"
                )}
              >
                {PROJECT_STAGE_LABEL[s].label}
              </span>
            </div>
            {i < PROJECT_STAGE_ORDER.length - 1 && (
              <div className="relative h-px flex-1 bg-line">
                {lineFilled && <div className="absolute inset-0 bg-accent" />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
