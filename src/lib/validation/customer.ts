import { z } from "zod";

export const customerSignupSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(200),
  name: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

export const customerLoginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});
