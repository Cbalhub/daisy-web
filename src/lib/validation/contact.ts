import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(100),
  company: z.string().trim().max(150).optional().or(z.literal("")),
  email: z.string().trim().email("올바른 이메일 주소를 입력해 주세요.").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  budget: z.string().trim().max(50).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "내용을 10자 이상 입력해 주세요.")
    .max(3000),
  // 봇 차단용 허니팟 필드 — 실제 사용자에게는 보이지 않으며, 값이 채워지면 스팸으로 간주
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;
