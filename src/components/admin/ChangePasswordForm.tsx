"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

const inputCls =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue";

export function ChangePasswordForm() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const currentPassword = String(fd.get("currentPassword") ?? "");
    const newPassword = String(fd.get("newPassword") ?? "");
    const confirm = String(fd.get("confirm") ?? "");

    if (newPassword.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b?.error ?? "변경에 실패했습니다.");
      setLoading(false);
      return;
    }
    form.reset();
    setLoading(false);
    toast("비밀번호를 변경했어요", "success");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <label className="block text-xs font-medium text-admin-muted">
        현재 비밀번호
        <input name="currentPassword" type="password" required autoComplete="current-password" className={inputCls} />
      </label>
      <label className="block text-xs font-medium text-admin-muted">
        새 비밀번호 <span className="font-normal">(8자 이상)</span>
        <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
      </label>
      <label className="block text-xs font-medium text-admin-muted">
        새 비밀번호 확인
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
      </label>
      {error && <p className="text-xs text-admin-red">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-admin-blue px-4 py-2 text-xs font-semibold text-admin-bg disabled:opacity-50"
      >
        {loading ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
