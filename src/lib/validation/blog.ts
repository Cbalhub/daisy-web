import { z } from "zod";

export const BLOG_TONES = ["뼈때리기", "실무 가이드", "경험담"] as const;

export const blogGenerateSchema = z.object({
  topic: z.string().trim().min(3, "주제를 조금 더 구체적으로 적어주세요.").max(200),
  keywords: z.array(z.string().trim().min(1).max(30)).max(8).default([]),
  platform: z.enum(["NAVER", "TISTORY", "GENERIC"]).default("NAVER"),
  tone: z.enum(BLOG_TONES).default("뼈때리기"),
});

export const blogUpdateSchema = z
  .object({
    title: z.string().trim().max(150).optional(),
    body: z.string().max(20000).optional(),
    metaDescription: z.string().trim().max(200).optional(),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "변경할 내용이 없습니다." });
