"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ButtonEl } from "@/components/ui/Button";
import { isValidEmail } from "@/lib/isValidEmail";
import { useToast } from "@/components/ui/Toast";

export function LoginForm() {
  const params = useSearchParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    if (!isValidEmail(String(data.email ?? ""))) {
      toast("올바른 이메일 주소를 입력해 주세요.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "로그인에 실패했습니다.");
      }

      try {
        localStorage.setItem("movd-auth", "1");
      } catch {
        // 무시.
      }
      window.dispatchEvent(new Event("movd-auth-change"));
      // SPA 전환(router.replace)은 /account 의 RSC 페이로드를 클라이언트에서 한 번
      // 더 기다리게 해 체감이 느립니다. 전체 문서 로드로 넘기면 서버가 loading.tsx
      // 스켈레톤을 즉시 스트리밍해 훨씬 빠르게 느껴집니다.
      window.location.href = params.get("next") || "/account";
      return;
    } catch (err) {
      toast(err instanceof Error ? err.message : "로그인에 실패했습니다.", "error");
      setLoading(false);
    }
  }

  return (
    // method=post + action: JS 가 뜨지 않은 상태에서 실수로 폼이 전송되더라도
    // 자격증명이 URL 쿼리스트링(GET)에 노출되지 않도록 합니다.
    <form onSubmit={onSubmit} method="post" action="/api/account/login" noValidate className="space-y-5">
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
        <label className="text-sm font-medium text-ink-soft">비밀번호</label>
        <input
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>

      <ButtonEl type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "로그인 중..." : "로그인"}
      </ButtonEl>
    </form>
  );
}
