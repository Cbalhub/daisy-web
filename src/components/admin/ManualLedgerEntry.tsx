"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

const inputCls =
  "w-full rounded-lg border border-admin-border bg-admin-content px-3 py-2 text-sm outline-none focus:border-admin-blue";

function todayLocal() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function AddLedgerEntry() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const amountRaw = String(fd.get("amount") ?? "").replace(/[,\s]/g, "");
    const payload = {
      occurredAt: String(fd.get("occurredAt") ?? ""),
      kind: String(fd.get("kind") ?? "REVENUE"),
      title: String(fd.get("title") ?? "").trim(),
      detail: String(fd.get("detail") ?? "").trim(),
      customerName: String(fd.get("customerName") ?? "").trim(),
      amount: Number(amountRaw),
      businessRegNo: String(fd.get("businessRegNo") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      proofType: String(fd.get("proofType") ?? ""),
      memo: String(fd.get("memo") ?? "").trim(),
    };

    setLoading(true);
    const res = await fetch("/api/admin/ledger/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = body?.error ?? "추가에 실패했습니다.";
      setError(message);
      toast(message, "error");
      setLoading(false);
      return;
    }
    toast("장부에 추가했어요", "success");
    router.refresh();
    setOpen(false);
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-admin-border px-3.5 py-2 text-xs font-medium text-admin-text transition-colors hover:border-admin-blue hover:text-admin-blue"
      >
        <span className="text-sm leading-none">+</span> 행 추가
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-xl border border-admin-border bg-admin-surface p-5 shadow-[var(--shadow-e1)]"
    >
      <p className="text-sm font-semibold text-admin-text">장부에 직접 추가</p>
      <p className="mt-0.5 text-xs text-admin-muted">
        사이트 결제 흐름을 거치지 않고 받은 대금(계좌 직접 입금 등)을 적어 넣습니다.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-admin-muted">
          결제일
          <input type="date" name="occurredAt" required defaultValue={todayLocal()} className={`mt-1.5 ${inputCls}`} />
        </label>
        <label className="text-xs font-medium text-admin-muted">
          구분
          <select name="kind" defaultValue="REVENUE" className={`mt-1.5 ${inputCls}`}>
            <option value="REVENUE">결제(수입)</option>
            <option value="REFUND">환불</option>
          </select>
        </label>
        <label className="text-xs font-medium text-admin-muted">
          발주처 / 고객명
          <input name="customerName" required maxLength={100} className={`mt-1.5 ${inputCls}`} />
        </label>
        <label className="text-xs font-medium text-admin-muted">
          외주 프로젝트명
          <input name="title" required maxLength={200} className={`mt-1.5 ${inputCls}`} />
        </label>
        <label className="text-xs font-medium text-admin-muted sm:col-span-2">
          상세 기능
          <input name="detail" maxLength={1000} className={`mt-1.5 ${inputCls}`} />
        </label>
        <label className="text-xs font-medium text-admin-muted">
          금액 (KRW)
          <input
            name="amount"
            required
            inputMode="numeric"
            placeholder="1000000"
            className={`mt-1.5 ${inputCls} tabular-nums`}
          />
        </label>
        <label className="text-xs font-medium text-admin-muted">
          사업자등록번호 <span className="font-normal">(사업자면)</span>
          <input name="businessRegNo" maxLength={20} className={`mt-1.5 ${inputCls} tabular-nums`} />
        </label>
        <label className="text-xs font-medium text-admin-muted">
          연락처
          <input name="phone" maxLength={30} className={`mt-1.5 ${inputCls} tabular-nums`} />
        </label>
        <label className="text-xs font-medium text-admin-muted">
          증빙 수단
          <select name="proofType" defaultValue="" className={`mt-1.5 ${inputCls}`}>
            <option value="">선택 안 함</option>
            <option value="TAX_INVOICE">세금계산서</option>
            <option value="CASH_RECEIPT">현금영수증</option>
            <option value="TRANSFER_RECORD">계좌이체 내역</option>
            <option value="NONE">없음</option>
          </select>
        </label>
        <label className="text-xs font-medium text-admin-muted sm:col-span-2">
          비고
          <input name="memo" maxLength={1000} className={`mt-1.5 ${inputCls}`} />
        </label>
      </div>

      {error && <p className="mt-3 text-xs text-admin-red">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-admin-blue px-4 py-2 text-xs font-semibold text-admin-bg disabled:opacity-50"
        >
          {loading ? "추가 중..." : "추가"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-xs font-medium text-admin-muted hover:text-admin-text"
        >
          취소
        </button>
      </div>
    </form>
  );
}

export function DeleteManualEntry({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm("이 장부 항목을 삭제할까요?")) return;
    setLoading(true);
    const res = await fetch(`/api/admin/ledger/entries/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? "삭제에 실패했습니다.", "error");
      setLoading(false);
      return;
    }
    toast("삭제했어요", "success");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={loading}
      aria-label="삭제"
      className="rounded p-1 text-admin-muted opacity-0 transition-opacity hover:bg-admin-red-soft hover:text-admin-red group-hover:opacity-100 disabled:opacity-50"
    >
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden>
        <path
          d="M3 3l8 8M11 3l-8 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
