import { z } from "zod";

export const estimateGenerateSchema = z.object({
  sourceText: z.string().trim().min(20, "요구사항을 조금 더 붙여넣어 주세요.").max(20000),
});

const itemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  detail: z.string().trim().max(600).default(""),
  days: z.number().min(0).max(999),
});

const groupSchema = z.object({
  name: z.string().trim().min(1).max(120),
  note: z.string().trim().max(600).default(""),
  items: z.array(itemSchema).max(60),
});

export const estimateUpdateSchema = z
  .object({
    projectName: z.string().trim().max(80).optional(),
    summary: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(4000).optional(),
    groups: z.array(groupSchema).max(20).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "변경할 내용이 없습니다." });
