import { z } from "zod";

// 영문 소문자/숫자뿐 아니라 한글(완성형 음절)도 슬러그로 허용합니다 — URL에서는
// 자동으로 퍼센트 인코딩되어 문제없이 동작합니다.
const slugPattern = /^[a-z0-9가-힣]+(?:-[a-z0-9가-힣]+)*$/;

export const portfolioSchema = z.object({
  title: z.string().trim().min(1).max(150),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(slugPattern, "영문 소문자, 한글, 숫자, 하이픈(-)만 사용할 수 있습니다."),
  category: z.string().trim().min(1).max(100),
  summary: z.string().trim().min(1).max(500),
  body: z.string().trim().max(10000).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  industry: z.string().trim().max(50).optional().or(z.literal("")),
  features: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  duration: z.string().trim().max(50).optional().or(z.literal("")),
  cost: z.string().trim().max(50).optional().or(z.literal("")),
  // 업로드 API가 반환한 경로만 허용 — 임의의 외부 URL을 그대로 저장하지 않습니다.
  images: z
    .array(z.string().regex(/^\/uploads\/portfolio\/[a-zA-Z0-9_-]+\.(jpg|png|webp|gif)$/))
    .max(8)
    .default([]),
  published: z.boolean().default(false),
});
