"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonEl } from "@/components/ui/Button";
import { PrivacyConsent } from "@/components/ui/PrivacyConsent";
import { isValidEmail } from "@/lib/isValidEmail";
import { useToast } from "@/components/ui/Toast";

export function SignupForm() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    if (String(data.name ?? "").trim().length < 2) {
      toast("실명을 입력해 주세요.", "error");
      return;
    }
    if (!isValidEmail(String(data.email ?? ""))) {
      toast("올바른 이메일 주소를 입력해 주세요.", "error");
      return;
    }
    if (!/^[0-9+\-\s()]{9,}$/.test(String(data.phone ?? "").trim())) {
      toast("연락처를 정확히 입력해 주세요.", "error");
      return;
    }
    if (String(data.password ?? "").length < 8) {
      toast("비밀번호는 8자 이상이어야 합니다.", "error");
      return;
    }
    if (!data.privacyConsent) {
      toast("개인정보 수집 및 이용에 동의해 주세요.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/account/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "가입에 실패했습니다.");
      }

      toast("가입이 완료됐어요", "success");
      router.replace("/account");
    } catch (err) {
      toast(err instanceof Error ? err.message : "가입에 실패했습니다.", "error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <label className="text-sm font-medium text-ink-soft">
          이름 <span className="text-muted">(실명)</span>
        </label>
        <input
          name="name"
          required
          minLength={2}
          placeholder="계약·정산에 쓰이는 실명"
          className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-ink-soft">이메일</label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-ink-soft">연락처</label>
        <input
          name="phone"
          type="tel"
          required
          inputMode="tel"
          placeholder="010-0000-0000"
          className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-ink-soft">비밀번호</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="8자 이상"
          className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>

      <PrivacyConsent />

      <ButtonEl type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "가입 중..." : "회원가입"}
      </ButtonEl>
    </form>
  );
}
