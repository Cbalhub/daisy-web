import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import { RefundPanel } from "@/components/admin/RefundPanel";
import { ConfirmPaymentButton } from "@/components/admin/ConfirmPaymentButton";
import { CancelOrderButton } from "@/components/admin/CancelOrderButton";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, PROJECT_STAGE_LABEL } from "@/lib/admin/status";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });

  if (!order) notFound();

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const payLink = `${siteUrl}/pay/${order.orderToken}`;
  const hasManualPaidPayment = order.payments.some(
    (p) => p.status === "PAID" && p.pgProvider === "manual"
  );
  const cancellableUnpaid = ["DRAFT", "PENDING", "PAYMENT_CLAIMED", "EXPIRED"].includes(order.status);

  return (
    <div className="pb-16">
      <AdminPageHeader
        title={order.title}
        description={`${order.invoiceNumber} · ${order.customerName}`}
        action={
          <div className="flex flex-wrap items-start gap-2">
            {order.status === "PAID" && (
              <AdminBadge tone={PROJECT_STAGE_LABEL[order.progressStage].tone}>
                {PROJECT_STAGE_LABEL[order.progressStage].label}
              </AdminBadge>
            )}
            <AdminBadge tone={ORDER_STATUS_LABEL[order.status].tone}>
              {ORDER_STATUS_LABEL[order.status].label}
            </AdminBadge>
            {(order.status === "PENDING" || order.status === "PAYMENT_CLAIMED") && (
              <ConfirmPaymentButton orderId={order.id} />
            )}
            {cancellableUnpaid && <CancelOrderButton orderId={order.id} manual={false} />}
            {order.status === "PAID" && hasManualPaidPayment && (
              <CancelOrderButton orderId={order.id} manual />
            )}
          </div>
        }
      />

      <div className="grid gap-4 px-8 pt-6 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-admin-text">주문 정보</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="금액" value={`₩${order.amount.toLocaleString("ko-KR")}`} />
            {order.depositorName && (
              <Row label="입금자명" value={order.depositorName} highlight />
            )}
            <Row label="고객명" value={order.customerName} />
            <Row label="이메일" value={order.customerEmail} />
            {order.customerPhone && <Row label="연락처" value={order.customerPhone} />}
            {order.description && <Row label="설명" value={order.description} />}
            <Row
              label="생성일"
              value={new Intl.DateTimeFormat("ko-KR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(order.createdAt)}
            />
            {order.expiresAt && (
              <Row
                label="유효 기한"
                value={new Intl.DateTimeFormat("ko-KR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(order.expiresAt)}
              />
            )}
          </dl>
        </AdminCard>

        <AdminCard>
          <h2 className="text-sm font-semibold text-admin-text">결제 링크</h2>
          <p className="mt-3 break-all rounded-lg bg-admin-content px-3 py-2.5 text-xs text-admin-muted">
            {payLink}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <CopyLinkButton text={payLink} />
            <a
              href={`/api/admin/orders/${order.id}/quote`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-admin-border bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-text transition-colors hover:border-admin-blue"
            >
              견적서 보기
            </a>
          </div>
        </AdminCard>
      </div>

      <div className="px-8 pt-4">
        <AdminCard className="p-0">
          <h2 className="px-5 pt-5 text-sm font-semibold text-admin-text">결제 시도 내역</h2>
          {order.payments.length === 0 ? (
            <p className="py-16 text-center text-sm text-admin-muted">
              아직 결제 시도가 없습니다.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-admin-border">
              {order.payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-admin-text">
                      {payment.paymentId}
                    </p>
                    <p className="mt-0.5 text-xs text-admin-muted">
                      ₩{payment.amount.toLocaleString("ko-KR")}
                      {payment.method ? ` · ${payment.method}` : ""}
                      {payment.approvedAt
                        ? ` · ${new Intl.DateTimeFormat("ko-KR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(payment.approvedAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminBadge tone={PAYMENT_STATUS_LABEL[payment.status].tone}>
                      {PAYMENT_STATUS_LABEL[payment.status].label}
                    </AdminBadge>
                    {payment.status === "PAID" && payment.pgProvider !== "manual" && (
                      <RefundPanel paymentId={payment.id} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-admin-muted">{label}</dt>
      <dd
        className={
          highlight
            ? "rounded-md bg-admin-blue-soft px-2 py-0.5 text-right font-semibold text-admin-blue"
            : "text-right font-medium text-admin-text"
        }
      >
        {value}
      </dd>
    </div>
  );
}
