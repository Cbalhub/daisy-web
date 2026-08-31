import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SuccessCelebration } from "@/components/payment/SuccessCelebration";

export const dynamic = "force-dynamic";

export default async function CheckoutCompletePage({
  params,
}: {
  params: Promise<{ orderToken: string }>;
}) {
  const { orderToken } = await params;
  const order = await prisma.order.findUnique({ where: { orderToken } });
  if (!order) notFound();

  if (order.status !== "PAID") {
    return (
      <div className="w-full max-w-md rounded-xl border border-line bg-paper p-7 text-center shadow-[var(--shadow-e1)]">
        <h1 className="font-display text-xl font-semibold tracking-tight">결제 확인 중입니다</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          결제 승인이 처리되는 동안 잠시 기다려 주세요. 몇 초 후에도 상태가 바뀌지
          않는다면 새로고침해 주세요.
        </p>
        <Link
          href={`/pay/${orderToken}`}
          className="mt-6 inline-block text-sm font-medium text-accent underline underline-offset-4"
        >
          새로고침
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center rounded-xl border border-line bg-paper p-8 text-center shadow-[var(--shadow-e1)]">
      <SuccessCelebration />
      <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">결제가 완료되었습니다</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {order.title} · ₩{order.amount.toLocaleString("ko-KR")} 결제가 정상적으로
        처리되었습니다. 확인 메일이 곧 발송됩니다.
      </p>
      <p className="mt-1 text-xs text-muted">{order.invoiceNumber}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-[10px] bg-accent px-5 text-sm font-semibold text-on-accent transition-[background-color] hover:bg-accent/90"
        >
          홈으로 돌아가기
        </Link>
        <Link
          href={`/pay/${orderToken}/receipt`}
          className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-[10px] border border-line px-5 text-sm font-semibold text-ink transition-colors hover:border-ink/25 hover:bg-paper-dim"
        >
          영수증 보기
        </Link>
      </div>
    </div>
  );
}
