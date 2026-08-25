"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/Card";
import { useToast } from "@/components/ui/Toast";

type Settings = {
  businessName: string;
  representativeName: string;
  businessRegNo: string;
  mailOrderRegNo: string;
  address: string;
  phone: string;
  contactEmail: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(
      Object.keys(initial).map((key) => [key, String(form.get(key) ?? "")])
    );

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? "저장에 실패했습니다.", "error");
      return;
    }

    toast("저장됐어요", "success");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AdminCard>
        <h2 className="text-sm font-semibold text-admin-text">무통장 입금 계좌</h2>
        <p className="mt-1 text-xs text-admin-muted">
          결제 페이지에서 고객에게 안내되는 입금 계좌 정보예요.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="은행명" name="bankName" defaultValue={initial.bankName} placeholder="예: 국민은행" />
          <Field
            label="계좌번호"
            name="bankAccountNumber"
            defaultValue={initial.bankAccountNumber}
            placeholder="000-00-000000"
          />
          <Field
            label="예금주"
            name="bankAccountHolder"
            defaultValue={initial.bankAccountHolder}
            placeholder="홍길동"
          />
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="text-sm font-semibold text-admin-text">
          사업자 정보 <span className="font-normal text-admin-muted">(전자상거래법상 표기 의무)</span>
        </h2>
        <p className="mt-1 text-xs text-admin-muted">
          홈페이지 하단(푸터)과 개인정보처리방침에 그대로 표시돼요.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="상호명" name="businessName" defaultValue={initial.businessName} />
          <Field label="대표자명" name="representativeName" defaultValue={initial.representativeName} />
          <Field label="사업자등록번호" name="businessRegNo" defaultValue={initial.businessRegNo} placeholder="000-00-00000" />
          <Field
            label="통신판매업신고번호"
            name="mailOrderRegNo"
            defaultValue={initial.mailOrderRegNo}
            placeholder="해당 없으면 비워두세요"
          />
          <Field label="사업장 주소" name="address" defaultValue={initial.address} />
          <Field label="대표 전화" name="phone" defaultValue={initial.phone} placeholder="000-0000-0000" />
          <Field label="문의 이메일" name="contactEmail" defaultValue={initial.contactEmail} />
        </div>
      </AdminCard>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-admin-blue px-5 py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-200 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-admin-muted">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
      />
    </div>
  );
}
