"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "로그인에 실패했습니다.");
      }

      toast("로그인됐어요", "success");
      router.replace(params.get("next") || "/admin");
    } catch (err) {
      toast(err instanceof Error ? err.message : "로그인에 실패했습니다.", "error");
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      onSubmit={onSubmit}
      noValidate
      className="w-full max-w-sm rounded-xl border border-admin-border bg-admin-surface p-8 shadow-[var(--shadow-e2)]"
    >
      <p className="text-xs font-semibold tracking-wide text-admin-blue">MOVD Admin</p>
      <h1 className="mt-2 text-xl font-semibold text-admin-text">관리자 로그인</h1>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-admin-muted">이메일</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm text-admin-text outline-none transition-colors focus:border-admin-blue"
            placeholder="admin@overcook.kr"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-admin-muted">비밀번호</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm text-admin-text outline-none transition-colors focus:border-admin-blue"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-admin-blue py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-200 ease-out hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </motion.form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
