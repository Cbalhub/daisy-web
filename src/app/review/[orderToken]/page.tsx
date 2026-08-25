import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ReviewSubmitForm } from "@/components/marketing/ReviewSubmitForm";

export const dynamic = "force-dynamic";

export default async function ReviewSubmitPage({
  params,
}: {
  params: Promise<{ orderToken: string }>;
}) {
  const { orderToken } = await params;
  const order = await prisma.order.findUnique({
    where: { orderToken },
    include: { review: { select: { id: true } } },
  });

  if (!order) notFound();

  const isReady = order.status === "PAID" && order.progressStage === "DELIVERED";

  return (
    <div className="w-full max-w-lg rounded-2xl bg-paper p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)] sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {order.invoiceNumber}
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold">후기 남기기</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        &ldquo;{order.title}&rdquo; 프로젝트는 어떠셨나요? 남겨주신 후기는 확인 후
        사이트에 게시돼요.
      </p>

      <div className="mt-8">
        {order.review ? (
          <p className="rounded-xl bg-paper-dim px-4 py-3 text-center text-sm text-muted">
            이미 이 프로젝트에 후기를 남겨주셨어요. 감사합니다!
          </p>
        ) : isReady ? (
          <ReviewSubmitForm orderToken={order.orderToken} />
        ) : (
          <p className="rounded-xl bg-paper-dim px-4 py-3 text-center text-sm text-muted">
            아직 프로젝트 전달이 완료되지 않아 후기를 남길 수 없어요.
          </p>
        )}
      </div>
    </div>
  );
}
