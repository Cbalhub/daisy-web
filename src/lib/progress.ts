import "server-only";
import { prisma } from "@/lib/prisma";
import { postProgressUpdateMessage, getOrCreateDefaultConversation } from "@/lib/chat";
import { sendReviewRequestEmail } from "@/lib/email";
import { PROJECT_STAGE_LABEL } from "@/lib/admin/status";
import type { ProjectStage } from "@prisma/client";

/**
 * 주문의 진행 단계를 바꾸고, 연결된 고객 채팅방에 실시간으로 보이는 진행 상황
 * 카드를 남깁니다. 결제 완료 시 자동 호출(작업 시작 단계)과 관리자의 수동
 * 업데이트 양쪽에서 재사용합니다.
 */
export async function updateOrderProgress(input: {
  orderId: string;
  stage: ProjectStage;
  note?: string;
}) {
  const order = await prisma.order.update({
    where: { id: input.orderId },
    data: { progressStage: input.stage },
    select: {
      id: true,
      customerId: true,
      conversationId: true,
      orderToken: true,
      title: true,
      customerName: true,
      customerEmail: true,
    },
  });

  if (input.stage === "DELIVERED") {
    await sendReviewRequestEmail({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      orderTitle: order.title,
      orderToken: order.orderToken,
    }).catch((err) => console.error("review request email failed", err));
  }

  // 고객 계정과 연결되지 않은 주문(레거시/수동 발행)은 알릴 채팅방이 없음
  if (!order.customerId) return { order, message: null };

  // 이 주문이 채팅 안에서 발행된 결제 요청이었다면 그 대화로, 아니면(관리자
  // 페이지에서 직접 만든 주문 등) 고객의 가장 최근 대화로 보냅니다 — 고객마다
  // 대화가 여러 개일 수 있어 "그 고객의 대화"를 하나로 특정할 수 없기 때문입니다.
  const conversation = order.conversationId
    ? await prisma.chatConversation.findUnique({ where: { id: order.conversationId } })
    : await getOrCreateDefaultConversation(order.customerId);
  if (!conversation) return { order, message: null };

  const message = await postProgressUpdateMessage({
    conversationId: conversation.id,
    orderId: order.id,
    body: input.note?.trim() || `${PROJECT_STAGE_LABEL[input.stage].label} 단계로 업데이트되었습니다.`,
  });

  return { order, message };
}
