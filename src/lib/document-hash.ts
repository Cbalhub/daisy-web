import "server-only";
import { createHash } from "crypto";

/**
 * 거래확인서 무결성 해시입니다. 결제가 확인된 "그 순간"의 핵심 사실(금액·
 * 당사자·상태·시각)을 정규화된 문자열로 만들어 SHA-256을 계산하고,
 * AuditLog에 그 값을 그대로 저장해 둡니다. 나중에 문서를 열 때 같은 규칙으로
 * 현재 DB 값을 다시 해시해서 저장된 값과 비교하면, 그 사이에 금액이나 상태가
 * 바뀌었는지(위변조 여부)를 알 수 있습니다 — 매번 현재 값으로만 해시를
 * 새로 계산하면 데이터가 바뀌어도 항상 "일치"로 나와서 무의미해지므로,
 * 반드시 확인 시점의 값을 저장해 두는 것이 핵심입니다.
 */
export type TransactionFacts = {
  invoiceNumber: string;
  orderToken: string;
  customerName: string;
  customerEmail: string;
  title: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  approvedAt: string; // ISO
};

export function hashTransactionFacts(facts: TransactionFacts): string {
  const canonical = [
    facts.invoiceNumber,
    facts.orderToken,
    facts.customerName,
    facts.customerEmail,
    facts.title,
    String(facts.amount),
    facts.currency,
    facts.paymentMethod,
    facts.approvedAt,
  ].join("|");
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
