"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/Card";
import { isValidEmail } from "@/lib/isValidEmail";
import { useToast } from "@/components/ui/Toast";

export function OrderForm() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      amount: Number(form.get("amount")),
      customerName: String(form.get("customerName") ?? ""),
      customerEmail: String(form.get("customerEmail") ?? ""),
      customerPhone: String(form.get("customerPhone") ?? ""),
      businessRegNo: String(form.get("businessRegNo") ?? ""),
      expiresInDays: form.get("expiresInDays") ? Number(form.get("expiresInDays")) : undefined,
    };

    if (!isValidEmail(payload.customerEmail)) {
      toast("올바른 이메일 주소를 입력해 주세요.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "주문 생성에 실패했습니다.");
      }

      const { order } = await res.json();
      toast("주문이 생성됐어요", "success");
      router.push(`/admin/orders/${order.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "주문 생성에 실패했습니다.", "error");
      setLoading(false);
    }
  }

  return (
    <AdminCard>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="주문 제목" name="title" required placeholder="예: 랜딩페이지 제작 착수금" />
          <Field label="결제 금액 (원)" name="amount" type="number" required placeholder="3000000" />
        </div>

        <div>
          <label className="text-xs font-medium text-admin-muted">설명 (선택)</label>
          <textarea
            name="description"
            rows={3}
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-admin-blue"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="고객명" name="customerName" required placeholder="홍길동" />
          <Field label="고객 이메일" name="customerEmail" type="email" required placeholder="client@company.com" />
          <Field label="연락처 (선택)" name="customerPhone" placeholder="010-0000-0000" />
        </div>

        <Field
          label="사업자등록번호 (선택 — 사업자 고객만)"
          name="businessRegNo"
          placeholder="000-00-00000"
        />

        <Field
          label="유효 기간 (일, 선택)"
          name="expiresInDays"
          type="number"
          placeholder="예: 7"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-admin-blue px-5 py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-200 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "생성 중..." : "주문 생성 및 결제 링크 발급"}
        </button>
      </form>
    </AdminCard>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-admin-muted">
        {label} {required && <span className="text-admin-red">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={type === "number" ? 1 : undefined}
        className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-admin-blue"
      />
    </div>
  );
}
