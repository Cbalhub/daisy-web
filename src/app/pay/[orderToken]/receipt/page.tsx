import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";
import { PrintButton } from "@/components/payment/PrintButton";

export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" });

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "무통장입금",
};

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ orderToken: string }>;
}) {
  const { orderToken } = await params;
  const order = await prisma.order.findUnique({
    where: { orderToken },
    include: { payments: { where: { status: "PAID" }, orderBy: { approvedAt: "desc" }, take: 1 } },
  });

  if (!order || order.status !== "PAID") notFound();

  const payment = order.payments[0];
  const settings = await getBusinessSettings();

  return (
    <div className="w-full max-w-lg rounded-2xl bg-paper p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)] print:p-0 print:shadow-none sm:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-lg font-semibold">
            OverCook<span className="text-accent">.</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {settings.businessName}
            {settings.representativeName ? ` · 대표 ${settings.representativeName}` : ""}
            {settings.businessRegNo ? ` · 사업자등록번호 ${settings.businessRegNo}` : ""}
          </p>
        </div>
        <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
          영수증
        </p>
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <dl className="space-y-3 text-sm">
          <Row label="주문번호" value={order.invoiceNumber} />
          <Row label="항목" value={order.title} />
          <Row label="결제일시" value={payment?.approvedAt ? DATE_FORMAT.format(payment.approvedAt) : "-"} />
          <Row
            label="결제수단"
            value={
              (payment?.method && PAYMENT_METHOD_LABEL[payment.method]) ||
              payment?.method ||
              "-"
            }
          />
          <Row label="공급받는자" value={order.customerName} />
          <Row label="이메일" value={order.customerEmail} />
        </dl>
      </div>

      <div className="mt-6 flex items-end justify-between border-t border-line pt-6">
        <span className="text-sm text-muted">결제 금액</span>
        <span className="font-display text-2xl font-semibold tracking-tight tabular-nums">
          ₩{order.amount.toLocaleString("ko-KR")}
        </span>
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted">
        본 영수증은 OverCook 웹사이트에서 자동 발급되었습니다.
        <br />
        문의: {settings.contactEmail}
      </p>

      <div className="mt-8 flex justify-center print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
