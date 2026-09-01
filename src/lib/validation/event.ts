import { z } from "zod";

// 업로드 API가 반환한 경로만 허용 — 임의의 외부 URL을 그대로 저장하지 않습니다.
const imageUrl = z
  .string()
  .regex(/^\/uploads\/events\/[a-zA-Z0-9_-]+\.(jpg|png|webp|gif)$/)
  .or(z.literal(""));

export const eventSchema = z.object({
  enabled: z.boolean().default(true),
  order: z.number().int().min(0).max(9999).default(0),
  style: z.enum(["dark", "light", "festive"]).default("dark"),
  badge: z.string().trim().max(12),
  title: z.string().trim().max(60),
  description: z.string().trim().max(120),
  imageUrl: imageUrl.optional(),
});

// 부분 수정용 — 보낸 필드만 반영합니다. eventSchema.partial() 을 쓰면 .default() 가
// 살아있어서(zod 특성) enabled/order/style 을 안 보내도 기본값으로 덮어써버립니다.
// 목록에서 on/off 토글은 { enabled } 하나만 보내므로 그때 style·order 가 초기화되던
// 버그가 있었습니다. 그래서 기본값 없는 스키마를 따로 둡니다.
export const eventUpdateSchema = z
  .object({
    enabled: z.boolean(),
    order: z.number().int().min(0).max(9999),
    style: z.enum(["dark", "light", "festive"]),
    badge: z.string().trim().max(12),
    title: z.string().trim().max(60),
    description: z.string().trim().max(120),
    imageUrl,
  })
  .partial();
