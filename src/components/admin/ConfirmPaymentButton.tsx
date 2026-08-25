"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";

export function ConfirmPaymentButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    const res = await fetch(`/api/admin/orders/${orderId}/confirm-payment`, { method: "POST" });
    setLoading(false);
    setOpen(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? "처리에 실패했습니다.", "error");
      return;
    }

    toast("결제완료로 처리됐어요", "success");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-admin-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        입금 확인 → 결제완료 처리
      </button>
      <ConfirmDialog
        open={open}
        title="입금을 확인하셨나요?"
        description="확인하면 즉시 결제완료로 처리되고, 장부와 고객 채팅에 바로 반영돼요."
        confirmLabel="결제완료 처리"
        loading={loading}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
