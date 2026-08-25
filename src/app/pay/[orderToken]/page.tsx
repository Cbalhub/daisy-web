import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";
import { BankTransferPanel } from "@/components/payment/BankTransferPanel";
import { ClaimedStatusPoller } from "@/components/payment/ClaimedStatusPoller";
import { IconClock, IconCross } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderToken: string }>;
}) {
  const { orderToken } = await params;
  const order = await prisma.order.findUnique({ where: { orderToken } });

  if (!order) notFound();
  if (order.status === "PAID") redirect(`/pay/${orderToken}/complete`);

  const isPayable = order.status === "DRAFT" || order.status === "PENDING";
  const isClaimed = order.status === "PAYMENT_CLAIMED";
  const settings = isPayable ? await getBusinessSettings() : null;

  return (
    <div className="w-full max-w-md rounded-2xl bg-paper p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {order.invoiceNumber}
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold">{order.title}</h1>
      {order.description && (
        <p className="mt-2 text-sm leading-relaxed text-muted">{order.description}</p>
      )}

      <div className="mt-6 flex items-end justify-between gap-3 border-t border-line pt-5">
        <span className="text-sm text-muted">입금 금액</span>
        <span className="font-display text-3xl font-semibold tracking-tight tabular-nums">
          ₩{order.amount.toLocaleString("ko-KR")}
        </span>
      </div>

      <div className="mt-5 space-y-1 text-sm text-muted">
        <p>{order.customerName} 님께 발행된 결제 요청입니다.</p>
        {order.expiresAt && (
          <p>
            유효 기한:{" "}
            {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(
              order.expiresAt
            )}
          </p>
        )}
      </div>

      <a
        href={`/api/pay/${order.orderToken}/quote`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-opacity hover:opacity-70"
      >
        견적서 보기
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0">
          <path d="M7 13 13 7M13 7H8M13 7v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      <div className="mt-8">
        {isPayable && settings ? (
          <BankTransferPanel
            orderToken={order.orderToken}
            bankName={settings.bankName}
            bankAccountNumber={settings.bankAccountNumber}
            bankAccountHolder={settings.bankAccountHolder}
          />
        ) : isClaimed ? (
          <div className="flex items-center gap-3 rounded-xl bg-accent-soft px-4 py-3.5 text-sm text-ink">
            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/40" />
              <IconClock className="relative h-4 w-4 text-accent" />
            </span>
            입금 확인 중이에요. 확인되는 대로 채팅으로 알려드려요.
            <ClaimedStatusPoller />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-paper-dim px-4 py-3.5 text-sm text-muted">
            <IconCross className="h-4 w-4 shrink-0" />
            {order.status === "EXPIRED" && "결제 유효 시간이 지난 주문입니다."}
            {order.status === "CANCELLED" && "취소된 주문입니다."}
            {(order.status === "REFUNDED" || order.status === "PARTIAL") &&
              "이미 처리된 주문입니다."}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        지금은 무통장입금만 받고 있어요. 입금 확인은 담당자가 직접 확인 후 채팅으로 안내드려요.
      </p>
    </div>
  );
}
