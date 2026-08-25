"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export function CancelOrderButton({ orderId, manual }: { orderId: string; manual: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = body?.error ?? "취소 처리에 실패했습니다.";
      setError(message);
      toast(message, "error");
      setLoading(false);
      return;
    }

    toast(manual ? "환불 완료로 주문을 취소했어요" : "주문을 취소했어요", "success");
    router.refresh();
    setOpen(false);
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-admin-red/30 px-3 py-1.5 text-xs font-medium text-admin-red transition-colors hover:bg-admin-red-soft"
      >
        {manual ? "환불 완료 → 주문 취소" : "주문 취소"}
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-xs rounded-lg border border-admin-border bg-admin-surface p-4 text-left"
    >
      {manual && (
        <p className="mb-3 text-xs leading-relaxed text-admin-muted">
          계좌로 이미 환불을 보내신 뒤에만 눌러주세요. 이 버튼은 실제로 돈을 돌려보내지
          않고, 주문 상태만 환불 처리합니다.
        </p>
      )}
      <label className="text-xs font-medium text-admin-muted">취소 사유</label>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
        placeholder="예: 고객 요청에 의한 주문 취소"
        className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3 py-2 text-sm outline-none focus:border-admin-blue"
      />
      {error && <p className="mt-2 text-xs text-admin-red">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-admin-red px-3.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {loading ? "처리 중..." : "취소 확정"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-admin-muted"
        >
          닫기
        </button>
      </div>
    </form>
  );
}
