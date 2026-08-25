"use client";

import { useMemo, useState } from "react";
import { AdminCard } from "@/components/admin/ui/Card";
import { estimateTax, type EntityType } from "@/lib/tax-brackets";

function won(n: number) {
  return `${n < 0 ? "-" : ""}₩${Math.abs(Math.round(n)).toLocaleString("ko-KR")}`;
}

function toNumber(raw: string) {
  return Number(raw.replace(/[^0-9]/g, "")) || 0;
}

export function TaxCalculator() {
  const [entityType, setEntityType] = useState<EntityType>("individual");
  const [revenue, setRevenue] = useState("");
  const [expense, setExpense] = useState("");
  const [otherIncome, setOtherIncome] = useState("");

  const parsedRevenue = toNumber(revenue);
  const parsedExpense = toNumber(expense);
  const parsedOtherIncome = toNumber(otherIncome);

  const result = useMemo(() => {
    if (parsedRevenue === 0) return null;
    return estimateTax({
      entityType,
      annualRevenue: parsedRevenue,
      annualExpense: parsedExpense,
      otherIncome: parsedOtherIncome,
    });
  }, [entityType, parsedRevenue, parsedExpense, parsedOtherIncome]);

  const bufferPercent =
    result && parsedRevenue > 0
      ? ((Math.max(result.vatPayable, 0) + result.totalTax) / parsedRevenue) * 100
      : 0;

  return (
    <AdminCard>
      <h3 className="text-base font-semibold text-admin-text">세금 계산기 (추정치)</h3>
      <p className="mt-1 text-xs leading-relaxed text-admin-muted">
        연 매출·경비를 넣으면 대략적인 부가세·
        {entityType === "corporate" ? "법인세" : "종합소득세"}를 추정해요. 인적공제·세액공제
        등은 반영하지 않은 단순 추정이라 실제 신고 세액과 다를 수 있어요 — 정확한 금액은 홈택스
        모의계산이나 세무사 확인이 필요해요.
      </p>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => setEntityType("individual")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            entityType === "individual"
              ? "border-admin-blue bg-admin-blue-soft text-admin-blue"
              : "border-admin-border text-admin-muted hover:text-admin-text"
          }`}
        >
          개인사업자
        </button>
        <button
          type="button"
          onClick={() => setEntityType("corporate")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            entityType === "corporate"
              ? "border-admin-blue bg-admin-blue-soft text-admin-blue"
              : "border-admin-border text-admin-muted hover:text-admin-text"
          }`}
        >
          법인
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field
          label="연 매출 (부가세 포함)"
          value={revenue}
          onChange={setRevenue}
          placeholder="예: 100000000"
        />
        <Field
          label="연 경비 (부가세 포함, 사업용 지출)"
          value={expense}
          onChange={setExpense}
          placeholder="예: 10000000"
        />
        {entityType === "individual" && (
          <div className="md:col-span-2">
            <Field
              label="다른 종합소득 (근로소득 등, 없으면 비워두기)"
              value={otherIncome}
              onChange={setOtherIncome}
              placeholder="예: 0"
            />
          </div>
        )}
      </div>

      {result && (
        <div className="mt-6 space-y-3 border-t border-admin-border pt-5">
          <Row label="부가세 매출세액" value={won(result.vatOutput)} />
          <Row label="부가세 매입세액" value={`-${won(result.vatInput)}`} />
          <Row
            label={result.vatPayable >= 0 ? "부가세 납부(예상)" : "부가세 환급(예상)"}
            value={won(Math.abs(result.vatPayable))}
            emphasis
          />
          <Row label="순이익 (매출-경비, 공급가액 기준)" value={won(result.netProfit)} />
          <Row
            label={entityType === "corporate" ? "법인세 산출세액" : "소득세 산출세액"}
            value={won(result.incomeTax)}
          />
          <Row label="지방소득세 (산출세액의 10%)" value={won(result.localIncomeTax)} />
          <Row
            label={entityType === "corporate" ? "총 예상 법인세" : "총 예상 종합소득세"}
            value={won(result.totalTax)}
            emphasis
          />

          <div className="mt-2 rounded-lg bg-admin-blue-soft px-4 py-3 text-sm leading-relaxed text-admin-blue">
            이 매출 규모면 대략 <strong>{bufferPercent.toFixed(1)}%</strong> 정도가 세금 몫이에요.
            매출 들어올 때마다 이 비율만큼 바로 다른 계좌로 분리해두면 5월·7월·1월에 놀랄 일이
            줄어들어요.
          </div>
        </div>
      )}
    </AdminCard>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-admin-muted">{label}</label>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
      />
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-admin-muted">{label}</span>
      <span
        className={
          emphasis
            ? "text-base font-semibold tabular-nums text-admin-text"
            : "text-sm font-medium tabular-nums text-admin-text"
        }
      >
        {value}
      </span>
    </div>
  );
}
