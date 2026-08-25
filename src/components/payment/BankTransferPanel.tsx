"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { copyToClipboard } from "@/lib/clipboard";

const COPIED_RESET_MS = 1500;

export function BankTransferPanel({
  orderToken,
  bankName,
  bankAccountNumber,
  bankAccountHolder,
}: {
  orderToken: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [depositorName, setDepositorName] = useState("");
  const [copied, setCopied] = useState(false);
  const copiedResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAccount = Boolean(bankName && bankAccountNumber);

  async function copyAccount() {
    const ok = await copyToClipboard(bankAccountNumber);
    toast(ok ? "계좌번호가 복사됐어요" : "복사에 실패했어요. 직접 입력해 주세요.", ok ? "success" : "error");
    if (!ok) return;

    setCopied(true);
    if (copiedResetTimer.current) clearTimeout(copiedResetTimer.current);
    copiedResetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }

  async function claimDeposit() {
    if (!depositorName.trim()) {
      toast("입금자명을 입력해 주세요", "error");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/pay/${orderToken}/claim-deposit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositorName: depositorName.trim() }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? "처리에 실패했습니다.", "error");
      return;
    }

    toast("입금 완료를 알려드렸어요", "success");
    router.refresh();
  }

  if (!hasAccount) {
    return (
      <p className="rounded-xl bg-paper-dim px-4 py-3 text-center text-sm text-muted">
        입금 계좌 정보가 아직 준비되지 않았어요. 채팅으로 문의해 주세요.
      </p>
    );
  }

  return (
    <div>
      <div className="rounded-2xl bg-paper-dim p-6 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)]">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">입금 계좌</p>
        <button
          onClick={copyAccount}
          className="mt-3 inline-flex items-center gap-2 text-2xl font-semibold tracking-tight transition-opacity hover:opacity-70"
        >
          {bankName} {bankAccountNumber}
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0 text-accent">
              <path d="M4.5 10.5L8 14L15.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0 text-muted">
              <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M4 13V5a1 1 0 0 1 1-1h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <p className="mt-1 text-sm text-muted">예금주: {bankAccountHolder}</p>
      </div>

      <div className="mt-4">
        <label htmlFor="depositorName" className="text-sm font-medium text-ink">
          입금자명
        </label>
        <input
          id="depositorName"
          value={depositorName}
          onChange={(e) => setDepositorName(e.target.value)}
          placeholder="실제로 입금하실 때 사용할 이름"
          maxLength={40}
          className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
        />
      </div>

      <button
        onClick={claimDeposit}
        disabled={loading}
        className="mt-4 w-full rounded-full bg-accent py-3.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "처리 중..." : "입금 완료했어요"}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        위 계좌로 입금자명과 정확한 금액을 입금한 뒤 버튼을 눌러주세요. 확인되면 채팅으로 알려드려요.
      </p>
    </div>
  );
}
