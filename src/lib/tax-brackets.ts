// 대략적인 세금 추정용 유틸입니다. 인적공제·세액공제·감면 등은 반영하지 않은
// 단순화된 계산이라 실제 신고 세액과 차이가 날 수 있습니다 — 어드민 도움말
// 페이지의 "대략 얼마나 떼놔야 하는지" 감을 잡는 용도로만 씁니다.

type Bracket = { upTo: number; rate: number; deduction: number };

// 종합소득세(개인) 누진세율 — 2024년 기준 과세표준 구간.
const INCOME_TAX_BRACKETS: Bracket[] = [
  { upTo: 14_000_000, rate: 0.06, deduction: 0 },
  { upTo: 50_000_000, rate: 0.15, deduction: 1_260_000 },
  { upTo: 88_000_000, rate: 0.24, deduction: 5_760_000 },
  { upTo: 150_000_000, rate: 0.35, deduction: 15_440_000 },
  { upTo: 300_000_000, rate: 0.38, deduction: 19_940_000 },
  { upTo: 500_000_000, rate: 0.4, deduction: 25_940_000 },
  { upTo: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
  { upTo: Infinity, rate: 0.45, deduction: 65_940_000 },
];

// 법인세 누진세율 — 2024년 기준 과세표준 구간.
const CORPORATE_TAX_BRACKETS: Bracket[] = [
  { upTo: 200_000_000, rate: 0.09, deduction: 0 },
  { upTo: 20_000_000_000, rate: 0.19, deduction: 18_000_000 },
  { upTo: 300_000_000_000, rate: 0.21, deduction: 418_000_000 },
  { upTo: Infinity, rate: 0.24, deduction: 9_418_000_000 },
];

function applyBrackets(base: number, brackets: Bracket[]) {
  if (base <= 0) return 0;
  const bracket = brackets.find((b) => base <= b.upTo) ?? brackets[brackets.length - 1];
  return Math.max(base * bracket.rate - bracket.deduction, 0);
}

export type EntityType = "individual" | "corporate";

export type TaxEstimateInput = {
  entityType: EntityType;
  annualRevenue: number; // 부가세 포함 연매출
  annualExpense: number; // 부가세 포함 연경비(사업용)
  otherIncome?: number; // 개인: 근로소득 등 이미 있는 다른 종합소득
};

export type TaxEstimate = {
  vatOutput: number; // 매출세액
  vatInput: number; // 매입세액
  vatPayable: number; // 납부세액(음수면 환급)
  netProfit: number; // 순이익(공급가액 기준, 매출-경비)
  taxBase: number; // 과세표준
  incomeTax: number; // 소득세/법인세 산출세액
  localIncomeTax: number; // 지방소득세(산출세액의 10%)
  totalTax: number; // 총 예상 납부세액(소득세+지방소득세)
};

export function estimateTax({
  entityType,
  annualRevenue,
  annualExpense,
  otherIncome = 0,
}: TaxEstimateInput): TaxEstimate {
  const vatOutput = Math.round((annualRevenue * 10) / 110);
  const vatInput = Math.round((annualExpense * 10) / 110);
  const vatPayable = vatOutput - vatInput;

  const supplyRevenue = annualRevenue - vatOutput;
  const supplyExpense = annualExpense - vatInput;
  const netProfit = supplyRevenue - supplyExpense;

  if (entityType === "corporate") {
    const taxBase = Math.max(netProfit, 0);
    const incomeTax = Math.round(applyBrackets(taxBase, CORPORATE_TAX_BRACKETS));
    const localIncomeTax = Math.round(incomeTax * 0.1);
    return { vatOutput, vatInput, vatPayable, netProfit, taxBase, incomeTax, localIncomeTax, totalTax: incomeTax + localIncomeTax };
  }

  const basicDeduction = 1_500_000; // 본인 기본공제만 반영한 단순화 값
  const taxBase = Math.max(netProfit + otherIncome - basicDeduction, 0);
  const incomeTax = Math.round(applyBrackets(taxBase, INCOME_TAX_BRACKETS));
  const localIncomeTax = Math.round(incomeTax * 0.1);

  return { vatOutput, vatInput, vatPayable, netProfit, taxBase, incomeTax, localIncomeTax, totalTax: incomeTax + localIncomeTax };
}
