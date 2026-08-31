import { z } from "zod";

// 관리자가 주문에서 계약서를 만들 때 입력하는 값.
export const createContractSchema = z.object({
  scope: z.string().trim().min(5, "용역 범위를 입력해 주세요.").max(5000),
  amount: z.number().int().positive().max(10_000_000_000),
  startDate: z
    .string()
    .trim()
    .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), "날짜 형식이 올바르지 않습니다.")
    .optional()
    .or(z.literal("")),
  endDate: z
    .string()
    .trim()
    .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), "날짜 형식이 올바르지 않습니다.")
    .optional()
    .or(z.literal("")),
  warrantyMonths: z.number().int().min(0).max(36).default(1),
  paymentTerms: z.string().trim().max(1000).optional().or(z.literal("")),
  specialTerms: z.string().trim().max(3000).optional().or(z.literal("")),
  clientBizNo: z.string().trim().max(20).optional().or(z.literal("")),
});

// 고객이 계약서에 서명할 때.
export const signContractSchema = z.object({
  signedName: z.string().trim().min(2, "성함을 입력해 주세요.").max(100),
  // "data:image/png;base64,...." 형태. 너무 큰 서명은 거부.
  signatureDataUrl: z
    .string()
    .startsWith("data:image/png;base64,", "서명을 입력해 주세요.")
    .max(500_000, "서명 이미지가 너무 큽니다."),
  agreed: z.literal(true, { message: "본인 확인에 동의해 주세요." }),
});
