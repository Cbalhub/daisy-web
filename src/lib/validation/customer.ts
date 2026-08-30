import { z } from "zod";

export const customerSignupSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(200),
  // 계약·정산 대상이라 실명·연락처는 필수입니다.
  name: z
    .string()
    .trim()
    .min(2, "실명을 입력해 주세요.")
    .max(100),
  phone: z
    .string()
    .trim()
    .min(9, "연락처를 정확히 입력해 주세요.")
    .max(30)
    .regex(/^[0-9+\-\s()]+$/, "연락처는 숫자와 - 만 입력해 주세요."),
});

export const customerLoginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});
