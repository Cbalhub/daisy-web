"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignaturePad } from "./SignaturePad";

export function SignForm({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("서명하시는 분의 성함을 입력해 주세요.");
      return;
    }
    if (!signature) {
      setError("서명란에 서명해 주세요.");
      return;
    }
    if (!agreed) {
      setError("본인 확인에 동의해 주세요.");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/contract/${token}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signedName: name.trim(), signatureDataUrl: signature, agreed: true }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error ?? "서명 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setLoading(false);
      return;
    }

    // 서버가 SIGNED 상태로 바뀐 페이지를 다시 그리도록 합니다.
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <label className="block text-sm font-medium text-ink">
        서명하시는 분 성함
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          autoComplete="name"
          placeholder="예: 홍길동"
          className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
      </label>

      <div>
        <p className="text-sm font-medium text-ink">서명</p>
        <div className="mt-1.5">
          <SignaturePad onChange={setSignature} />
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
        />
        <span>
          본인은 위 계약 내용을 모두 확인하였으며, 전자적 방법으로 서명하는 것에 동의합니다. 서명 시각과
          접속 정보(IP)가 계약 성립의 증거로 함께 기록되는 것에 동의합니다.
        </span>
      </label>

      {error && <p className="text-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-on-accent shadow-[var(--shadow-e1)] transition-all hover:bg-accent-bright hover:shadow-[var(--shadow-e2)] active:translate-y-px active:shadow-none disabled:opacity-50"
      >
        {loading ? "처리 중…" : "동의하고 서명 제출"}
      </button>
    </form>
  );
}
