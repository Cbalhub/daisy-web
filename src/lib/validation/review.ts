import { z } from "zod";

export const reviewSchema = z.object({
  company: z.string().trim().min(1).max(100),
  role: z.string().trim().max(50).optional().or(z.literal("")),
  quote: z.string().trim().min(1).max(1000),
  // 실제로 받은 평점만 입력 — 모르면 비워둡니다(지어내지 않음).
  rating: z.number().int().min(1).max(5).optional(),
  order: z.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(false),
});

// 고객이 프로젝트 완료 후 직접 제출하는 후기입니다. 관리자 등록 폼과 달리
// order(노출 순서)·published는 관리자만 다루는 값이라 여기 없고, rating은
// 고객이 실제로 매기는 값이라 필수입니다.
export const customerReviewSchema = z.object({
  company: z.string().trim().min(1, "공개될 이름을 입력해 주세요.").max(100),
  role: z.string().trim().max(50).optional().or(z.literal("")),
  quote: z.string().trim().min(1, "후기 내용을 입력해 주세요.").max(1000),
  rating: z.number().int().min(1, "별점을 선택해 주세요.").max(5),
});
