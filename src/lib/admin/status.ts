import type { InquiryStatus, OrderStatus, PaymentStatus, ProjectStage } from "@prisma/client";

type Tone = "neutral" | "blue" | "green" | "amber" | "red";

export const PROJECT_STAGE_LABEL: Record<ProjectStage, { label: string; tone: Tone }> = {
  RECEIVED: { label: "작업 시작", tone: "neutral" },
  IN_PROGRESS: { label: "작업 중", tone: "blue" },
  DELIVERED: { label: "작업물 전달완료", tone: "green" },
};

export const PROJECT_STAGE_ORDER: ProjectStage[] = ["RECEIVED", "IN_PROGRESS", "DELIVERED"];

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, { label: string; tone: Tone }> = {
  NEW: { label: "신규", tone: "blue" },
  CONTACTED: { label: "연락함", tone: "amber" },
  QUALIFIED: { label: "가망", tone: "green" },
  CLOSED: { label: "종료", tone: "neutral" },
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "초안", tone: "neutral" },
  PENDING: { label: "결제 대기", tone: "amber" },
  PAYMENT_CLAIMED: { label: "입금 확인 필요", tone: "blue" },
  PAID: { label: "결제 완료", tone: "green" },
  PARTIAL: { label: "부분 취소", tone: "amber" },
  EXPIRED: { label: "만료", tone: "neutral" },
  CANCELLED: { label: "취소", tone: "red" },
  REFUNDED: { label: "환불", tone: "red" },
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, { label: string; tone: Tone }> = {
  READY: { label: "대기", tone: "neutral" },
  PAID: { label: "완료", tone: "green" },
  FAILED: { label: "실패", tone: "red" },
  CANCELLED: { label: "취소", tone: "red" },
  PARTIAL_CANCELLED: { label: "부분취소", tone: "amber" },
};
