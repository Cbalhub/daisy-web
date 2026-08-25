import { z } from "zod";

export const eventSchema = z.object({
  enabled: z.boolean().default(true),
  order: z.number().int().min(0).max(9999).default(0),
  style: z.enum(["dark", "light", "festive"]).default("dark"),
  badge: z.string().trim().max(12),
  title: z.string().trim().max(60),
  description: z.string().trim().max(120),
  // 업로드 API가 반환한 경로만 허용 — 임의의 외부 URL을 그대로 저장하지 않습니다.
  imageUrl: z
    .string()
    .regex(/^\/uploads\/events\/[a-zA-Z0-9_-]+\.(jpg|png|webp|gif)$/)
    .optional()
    .or(z.literal("")),
});
