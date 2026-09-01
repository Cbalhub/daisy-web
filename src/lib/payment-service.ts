import "server-only";
import { randomUUID } from "crypto";
import { Prisma, type Order } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { updateOrderProgress } from "@/lib/progress";
import { postAdminReply, getOrCreateDefaultConversation } from "@/lib/chat";
import { sendPaymentConfirmedEmail } from "@/lib/email";
import { sendSlackText } from "@/lib/slack";
import { hashTransactionFacts } from "@/lib/document-hash";

const MAX_INVOICE_NUMBER_RETRIES = 5;

function generateInvoiceNumber() {
  const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MOVD-${yyyymm}-${random}`;
}

/**
 * 사람이 읽는 invoiceNumber는 매달 형식이 겹칠 수 있어 DB unique 제약을 걸어두었습니다.
 * 관리자가 동시에 여러 주문을 생성하는 등 드물게 충돌이 나더라도, 실패시키는 대신
 * 새 번호로 재시도합니다. (orderToken은 cuid 기본값이라 충돌 가능성이 없어 재시도 불필요)
 */
export async function createOrder(input: {
  title: string;
  description?: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  businessRegNo?: string;
  expiresAt?: Date;
  createdById?: string; // 관리자가 발급한 주문에만 존재 — 고객이 직접 구매한 주문은 없음
  customerId?: string; // 로그인한 상태로 구매/문의한 경우에만 존재
  conversationId?: string; // 채팅 안에서 발행된 결제 요청인 경우에만 존재
  lineItems?: { label: string; amount?: number }[]; // 견적서용 기능 목록 — 가격은 관리자가 항목별로 직접 입력(선택)
}): Promise<Order> {
  for (let attempt = 0; attempt < MAX_INVOICE_NUMBER_RETRIES; attempt++) {
    try {
      return await prisma.order.create({
        data: { ...input, invoiceNumber: generateInvoiceNumber() },
      });
    } catch (err) {
      const isInvoiceCollision =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        (err.meta?.target as string[] | undefined)?.includes("invoiceNumber");
      if (!isInvoiceCollision) throw err;
    }
  }
  throw new Error("주문 번호 생성에 반복적으로 실패했습니다. 다시 시도해 주세요.");
}

type ManualConfirmResult = { ok: true } | { ok: false; reason: string };

/**
 * 무통장입금 전용 흐름의 마지막 단계입니다. 관리자가 실제 통장 입금 내역을 눈으로
 * 확인한 뒤에만 눌러야 합니다 — 결제대행사를 거치지 않으므로 여기서 검증할 수 있는
 * 외부 근거가 없고, 전적으로 관리자의 확인에 의존합니다.
 */
export async function confirmManualPayment(input: {
  orderId: string;
  adminId: string;
}): Promise<ManualConfirmResult> {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) return { ok: false, reason: "ORDER_NOT_FOUND" };
  if (order.status !== "PENDING" && order.status !== "PAYMENT_CLAIMED") {
    return { ok: false, reason: "NOT_CONFIRMABLE" };
  }

  const approvedAt = new Date();
  // 확인 "그 순간"의 사실을 해시로 고정해 둡니다 — 나중에 누군가 DB에서 금액 등을
  // 직접 바꾸더라도, 이 저장된 해시와 그때 다시 계산한 해시가 달라져서 위변조를
  // 알아챌 수 있습니다. 매번 현재 값으로만 새로 해시하면 데이터가 바뀌어도 항상
  // "일치"로 나와 의미가 없으므로, 반드시 이 시점에 계산해 저장해야 합니다.
  const integrityHash = hashTransactionFacts({
    invoiceNumber: order.invoiceNumber,
    orderToken: order.orderToken,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    title: order.title,
    amount: order.amount,
    currency: order.currency,
    paymentMethod: "bank_transfer",
    approvedAt: approvedAt.toISOString(),
  });

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: "PAID" },
    });
    if (result.count === 0) return false;

    await tx.payment.create({
      data: {
        orderId: order.id,
        paymentId: `manual_${randomUUID()}`,
        pgProvider: "manual",
        method: "bank_transfer",
        amount: order.amount,
        currency: order.currency,
        status: "PAID",
        approvedAt,
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        action: "order.manual_payment_confirm",
        targetType: "Order",
        targetId: order.id,
        metadata: { amount: order.amount, approvedAt: approvedAt.toISOString(), integrityHash },
      },
    });

    return true;
  });

  if (!updated) return { ok: false, reason: "ALREADY_PROCESSED" };

  await updateOrderProgress({
    orderId: order.id,
    stage: "RECEIVED",
    note: "입금이 확인되어 프로젝트 접수가 확정됐습니다.",
  }).catch((err) => console.error("progress notify failed", err));

  await sendPaymentConfirmedEmail({
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    orderTitle: order.title,
    amount: order.amount,
    orderToken: order.orderToken,
  }).catch((err) => console.error("payment confirmation email failed", err));

  await sendSlackText(
    `✅ 결제 완료 처리 — ${order.title}\n₩${order.amount.toLocaleString("ko-KR")} · ${order.customerName}`,
    { webhook: process.env.SLACK_WEBHOOK_URL_PAYMENT || undefined }
  ).catch(() => {});

  return { ok: true };
}

type CancelOrderResult = { ok: true } | { ok: false; reason: string };

/**
 * 아직 결제되지 않은 주문(초안/결제대기/입금확인중/만료)을 취소합니다.
 * 돈이 오간 적이 없으므로 상태만 CANCELLED로 바꾸면 됩니다.
 */
export async function cancelUnpaidOrder(input: {
  orderId: string;
  adminId: string;
  reason: string;
}): Promise<CancelOrderResult> {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) return { ok: false, reason: "ORDER_NOT_FOUND" };
  if (!["DRAFT", "PENDING", "PAYMENT_CLAIMED", "EXPIRED"].includes(order.status)) {
    return { ok: false, reason: "NOT_CANCELLABLE" };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: "CANCELLED" },
    });
    if (result.count === 0) return false;

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        action: "order.cancel",
        targetType: "Order",
        targetId: order.id,
        metadata: { reason: input.reason },
      },
    });
    return true;
  });

  if (!updated) return { ok: false, reason: "ALREADY_PROCESSED" };

  if (order.customerId) {
    const conversationId =
      order.conversationId ?? (await getOrCreateDefaultConversation(order.customerId)).id;
    await postAdminReply({
      conversationId,
      body: `"${order.title}" 건 결제 요청이 취소됐어요.`,
    }).catch((err) => console.error("cancel notice failed", err));
  }

  return { ok: true };
}

/**
 * 무통장입금으로 결제완료된 주문을 취소 처리합니다. 관리자가 계좌로 이미 직접
 * 환불을 보낸 뒤에만 눌러야 합니다 — 여기서 실제로 돈이 오갔는지 시스템이 검증할
 * 방법이 없고, 전적으로 관리자의 확인에 의존합니다.
 */
export async function cancelManualOrder(input: {
  orderId: string;
  adminId: string;
  reason: string;
}): Promise<CancelOrderResult> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { payments: { where: { status: "PAID" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) return { ok: false, reason: "ORDER_NOT_FOUND" };
  if (order.status !== "PAID") return { ok: false, reason: "NOT_CANCELLABLE" };

  const payment = order.payments[0];
  if (!payment) return { ok: false, reason: "PAYMENT_NOT_FOUND" };

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: order.id, status: "PAID" },
      data: { status: "REFUNDED" },
    });
    if (result.count === 0) return false;

    await tx.payment.update({ where: { id: payment.id }, data: { status: "CANCELLED" } });

    await tx.refund.create({
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        reason: input.reason,
        adminId: input.adminId,
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        action: "order.manual_refund_confirm",
        targetType: "Order",
        targetId: order.id,
        metadata: { amount: payment.amount, reason: input.reason },
      },
    });
    return true;
  });

  if (!updated) return { ok: false, reason: "ALREADY_PROCESSED" };

  if (order.customerId) {
    const conversationId =
      order.conversationId ?? (await getOrCreateDefaultConversation(order.customerId)).id;
    await postAdminReply({
      conversationId,
      body: `"${order.title}" 건 환불이 완료되어 주문이 취소 처리됐어요.`,
    }).catch((err) => console.error("cancel notice failed", err));
  }

  return { ok: true };
}
