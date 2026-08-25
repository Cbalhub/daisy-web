import { z } from "zod";

export const createOrderSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  amount: z
    .number()
    .int()
    .positive()
    .max(500_000_000, "1회 결제 금액은 5억원을 넘을 수 없습니다."),
  customerName: z.string().trim().min(1).max(100),
  customerEmail: z.string().trim().email().max(200),
  customerPhone: z.string().trim().max(30).optional().or(z.literal("")),
  businessRegNo: z.string().trim().max(30).optional().or(z.literal("")),
  expiresInDays: z.number().int().min(1).max(90).optional(),
});

export const refundSchema = z.object({
  reason: z.string().trim().min(1).max(300),
  amount: z.number().int().positive().optional(),
});
