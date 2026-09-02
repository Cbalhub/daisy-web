import { z } from "zod";

// 장부에 직접 적어 넣는 항목 — 사이트 결제 흐름을 안 거친 대금(계좌 직접 입금 등).
export const manualLedgerEntrySchema = z.object({
  // "2026-09-01" 또는 "2026-09-01T15:00" 형태. 서버에서 Date 로 변환.
  occurredAt: z
    .string()
    .trim()
    .min(1, "날짜를 입력해 주세요.")
    .refine((s) => !Number.isNaN(Date.parse(s)), "날짜 형식이 올바르지 않습니다."),
  kind: z.enum(["REVENUE", "REFUND", "EXPENSE"]),
  title: z.string().trim().min(1, "항목명을 입력해 주세요.").max(200),
  detail: z.string().trim().max(1000).optional().or(z.literal("")),
  customerName: z.string().trim().min(1, "발주처/고객명을 입력해 주세요.").max(100),
  amount: z
    .number({ message: "금액을 숫자로 입력해 주세요." })
    .int("금액은 원 단위 정수여야 합니다.")
    .positive("금액은 0보다 커야 합니다.")
    .max(1_000_000_000, "금액이 너무 큽니다."),
  businessRegNo: z.string().trim().max(20).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  proofType: z
    .enum(["TAX_INVOICE", "CASH_RECEIPT", "TRANSFER_RECORD", "NONE"])
    .optional()
    .or(z.literal("")),
  expenseCategory: z
    .enum(["SERVER", "DOMAIN", "SUBCONTRACT", "TAX", "SOFTWARE", "MARKETING", "ETC"])
    .optional()
    .or(z.literal("")),
  taxInvoiceIssuedAt: z
    .string()
    .trim()
    .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), "날짜 형식이 올바르지 않습니다.")
    .optional()
    .or(z.literal("")),
  memo: z.string().trim().max(1000).optional().or(z.literal("")),
  // 이 항목을 연결할 고객 대화(ChatConversation) id. 빈 값이면 연결 없음.
  conversationId: z.string().trim().max(40).optional().or(z.literal("")),
  // true 면 연결된 대화로 안내 메시지를 보냅니다(저장 자체와는 별개, DB 에 저장 안 함).
  notifyChat: z.boolean().optional(),
});

export type ManualLedgerEntryInput = z.infer<typeof manualLedgerEntrySchema>;

// 사이트 결제/환불(자동 집계 행)에 붙이는 증빙 정보. 금액·날짜·고객은 결제 사실이라
// 못 고치고, 이 세 칸만 사후에 채웁니다.
export const ledgerProofSchema = z.object({
  source: z.enum(["payment", "refund"]),
  id: z.string().trim().min(1).max(40),
  proofType: z
    .enum(["TAX_INVOICE", "CASH_RECEIPT", "TRANSFER_RECORD", "NONE"])
    .optional()
    .or(z.literal("")),
  taxInvoiceIssuedAt: z
    .string()
    .trim()
    .refine((s) => s === "" || !Number.isNaN(Date.parse(s)), "날짜 형식이 올바르지 않습니다.")
    .optional()
    .or(z.literal("")),
  memo: z.string().trim().max(1000).optional().or(z.literal("")),
});
