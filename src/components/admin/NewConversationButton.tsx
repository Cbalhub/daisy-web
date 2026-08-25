"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewConversationButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/customers/${customerId}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error ?? "대화 생성에 실패했습니다.");
      return;
    }

    const { conversation } = await res.json();
    router.push(`/admin/chats/${conversation.id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-admin-border px-3.5 py-1.5 text-xs font-medium text-admin-text transition-colors hover:border-admin-blue"
      >
        + 새 프로젝트 대화 시작
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="새 프로젝트 이름 (예: 챗봇 제작)"
        className="w-52 rounded-lg border border-admin-border bg-admin-content px-3 py-1.5 text-xs outline-none focus:border-admin-blue"
      />
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="rounded-lg bg-admin-blue px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
      >
        {loading ? "생성 중..." : "시작"}
      </button>
      {error && <span className="text-xs text-admin-red">{error}</span>}
    </form>
  );
}
