import type { OrderStatus, ProjectStage } from "@prisma/client";

export type TimelineEvent = {
  at: Date;
  label: string;
  detail?: string;
};

type OrderLike = {
  createdAt: Date;
  status: OrderStatus;
  progressStage: ProjectStage;
};

/**
 * 주문의 진행 이벤트를 기존 타임스탬프들로 조립합니다(스키마 변경 없음).
 * - 주문 접수 (createdAt)
 * - 계약 서명 (contract.signedAt)
 * - 결제 완료 (payment.approvedAt, status PAID)
 * - 진행 업데이트 (채팅 PROGRESS_UPDATE 메시지들, body 를 detail 로)
 * - 전달 완료 (progressStage DELIVERED 인데 위 업데이트에 안 잡혔으면 보강)
 */
export function buildOrderTimeline(
  order: OrderLike,
  input: {
    signedAt?: Date | null;
    paidAt?: Date | null;
    progressMessages: { body: string; createdAt: Date }[];
  }
): TimelineEvent[] {
  const events: TimelineEvent[] = [{ at: order.createdAt, label: "문의 접수" }];

  if (input.signedAt) {
    events.push({ at: input.signedAt, label: "계약서 서명 완료" });
  }
  if (input.paidAt) {
    events.push({ at: input.paidAt, label: "결제 완료" });
  }

  let deliveredCovered = false;
  for (const m of input.progressMessages) {
    const body = m.body.trim();
    events.push({ at: m.createdAt, label: "진행 업데이트", detail: body || undefined });
    if (body.includes("전달")) deliveredCovered = true;
  }

  if (order.progressStage === "DELIVERED" && !deliveredCovered) {
    events.push({ at: order.createdAt, label: "작업물 전달 완료" });
  }

  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}
