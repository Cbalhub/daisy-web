import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";
import { hashTransactionFacts } from "@/lib/document-hash";
import { PrintButton } from "@/components/payment/PrintButton";

export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" });
const DATETIME_FORMAT = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "medium" });

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: "무통장입금",
};

type AuditMetadata = { amount?: number; approvedAt?: string; integrityHash?: string };

export default async function TransactionConfirmationPage({
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

  // 이 문서의 핵심 — 결제를 확인하던 그 순간 저장해 둔 해시를 찾습니다.
  // (현재 무통장입금만 지원하므로 이 로그가 항상 있어야 정상이지만, 혹시
  // 없는 과거 데이터라면 무결성 확인 없이 기본 정보만 보여줍니다.)
  const confirmLog = await prisma.auditLog.findFirst({
    where: { targetType: "Order", targetId: order.id, action: "order.manual_payment_confirm" },
    orderBy: { createdAt: "desc" },
  });
  const meta = (confirmLog?.metadata as AuditMetadata | null) ?? null;

  let integrityStatus: "verified" | "mismatch" | "unavailable" = "unavailable";
  let currentHash: string | null = null;
  if (meta?.integrityHash && meta.approvedAt) {
    currentHash = hashTransactionFacts({
      invoiceNumber: order.invoiceNumber,
      orderToken: order.orderToken,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      title: order.title,
      amount: order.amount,
      currency: order.currency,
      paymentMethod: payment?.method ?? "bank_transfer",
      approvedAt: meta.approvedAt,
    });
    integrityStatus = currentHash === meta.integrityHash ? "verified" : "mismatch";
  }

  return (
    <div className="w-full max-w-lg rounded-xl border border-line bg-paper p-7 shadow-[var(--shadow-e1)] print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">Daisy</p>
          <p className="mt-1 text-xs text-muted">거래확인서 · Transaction Confirmation</p>
        </div>
        <p className="shrink-0 rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft">
          {order.invoiceNumber}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6 text-sm">
        <div>
          <p className="text-xs text-muted">제공자 (Provider)</p>
          <p className="mt-1 font-medium">{settings.businessName || "Daisy"}</p>
          {settings.representativeName && (
            <p className="text-xs text-muted">대표 {settings.representativeName}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted">고객 (Client)</p>
          <p className="mt-1 font-medium">{order.customerName}</p>
          <p className="text-xs text-muted">{order.customerEmail}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-6">
        <dl className="space-y-3 text-sm">
          <Row label="프로젝트" value={order.title} />
          <Row label="합의일" value={DATE_FORMAT.format(order.createdAt)} />
          <Row
            label="결제일시"
            value={payment?.approvedAt ? DATETIME_FORMAT.format(payment.approvedAt) : "-"}
          />
          <Row
            label="결제수단"
            value={(payment?.method && PAYMENT_METHOD_LABEL[payment.method]) || payment?.method || "-"}
          />
          <Row label="상태" value="결제완료 (PAID)" />
        </dl>
      </div>

      <div className="mt-6 flex items-end justify-between border-t border-line pt-6">
        <span className="text-sm text-muted">거래 금액</span>
        <span className="font-display text-2xl font-semibold tracking-tight tabular-nums">
          ₩{order.amount.toLocaleString("ko-KR")}
        </span>
      </div>

      {/* 무결성 확인 — 결제 확인 시점에 저장해 둔 해시와 지금 다시 계산한 해시를
          비교합니다. 일치하면 그 사이 금액·당사자 정보가 DB에서 임의로 바뀌지
          않았다는 뜻입니다. */}
      <div className="mt-6 rounded-lg border border-line bg-paper-dim p-4">
        <p className="text-xs text-muted">무결성 확인</p>
        {integrityStatus === "verified" && (
          <p className="mt-1.5 text-sm font-medium text-success">
            ✓ 확인됨 — 결제 확인 시점 이후 거래 정보가 변경되지 않았습니다.
          </p>
        )}
        {integrityStatus === "mismatch" && (
          <p className="mt-1.5 text-sm font-medium text-error">
            ⚠ 불일치 — 결제 확인 이후 이 거래의 정보가 변경된 것으로 보입니다. 관리자에게 문의해 주세요.
          </p>
        )}
        {integrityStatus === "unavailable" && (
          <p className="mt-1.5 text-sm text-muted">이 거래는 무결성 해시가 기록되지 않았습니다.</p>
        )}
        {currentHash && (
          <p className="mt-2 break-all text-[11px] text-muted">SHA-256 {currentHash}</p>
        )}
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted">
        본 문서는 Daisy가 내부적으로 보관하는 거래 기록을 바탕으로 발급된 확인 문서이며,
        국세청 현금영수증이나 세금계산서를 대체하지 않습니다.
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
