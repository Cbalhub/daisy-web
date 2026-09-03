import { z } from "zod";

export const INQUIRY_BUDGETS = [
  "300만 이하",
  "300–700만",
  "700–1500만",
  "1500만 이상",
  "미정",
] as const;

export const INQUIRY_TIMELINES = ["2주 내", "1개월", "2~3개월", "미정"] as const;

// 채팅 진입 전 문의 폼. 첨부는 /api/chat/upload 가 반환한 경로만 허용.
export const chatStartSchema = z.object({
  message: z.string().trim().min(5, "문의 내용을 조금 더 적어주세요.").max(2000),
  budget: z.enum(INQUIRY_BUDGETS).optional(),
  preferredTimeline: z.enum(INQUIRY_TIMELINES).optional(),
  // /api/chat/upload 가 돌려준 경로만. (lib/upload.ts CHAT_UPLOAD_URL_RE 와 동일 —
  // 이 파일은 클라이언트에서도 import 하므로 node 전용 모듈을 끌어오지 않으려고 복제.)
  attachmentUrl: z
    .string()
    .regex(/^\/uploads\/chat\/[a-zA-Z0-9_-]+(\.[a-z0-9]{1,12})?$/)
    .optional(),
  attachmentName: z.string().trim().min(1).max(200).optional(),
  attachmentMime: z.string().trim().min(1).max(100).optional(),
});
