"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/Card";
import { useToast } from "@/components/ui/Toast";

type Initial = {
  id?: string;
  label: string;
  body: string;
  order: number;
};

const EMPTY: Initial = { label: "", body: "", order: 0 };

export function QuickReplyForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const toast = useToast();
  const data = initial ?? EMPTY;
  const isEdit = Boolean(data.id);

  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      label: String(form.get("label") ?? ""),
      body: String(form.get("body") ?? ""),
      order: Number(form.get("order") ?? 0),
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/quick-replies/${data.id}` : "/api/admin/quick-replies",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.error ?? "저장에 실패했습니다.");
      }

      toast("저장됐어요", "success");
      router.push("/admin/quick-replies");
    } catch (err) {
      toast(err instanceof Error ? err.message : "저장에 실패했습니다.", "error");
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!data.id || !confirm("이 빠른 답변을 삭제할까요?")) return;
    await fetch(`/api/admin/quick-replies/${data.id}`, { method: "DELETE" });
    toast("삭제됐어요", "success");
    router.push("/admin/quick-replies");
  }

  return (
    <AdminCard>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-admin-muted">
              버튼에 표시될 이름 <span className="text-admin-red">*</span>
            </label>
            <input
              name="label"
              defaultValue={data.label}
              required
              placeholder="예: 견적 안내"
              className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-admin-muted">
              표시 순서 <span className="font-normal normal-case text-admin-muted/70">(작을수록 먼저 표시)</span>
            </label>
            <input
              name="order"
              type="number"
              min={0}
              defaultValue={data.order}
              className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-admin-muted">
            실제 전송될 내용 <span className="text-admin-red">*</span>
          </label>
          <textarea
            name="body"
            defaultValue={data.body}
            required
            rows={5}
            placeholder="채팅창에서 이 버튼을 누르면 여기 내용이 입력창에 채워집니다. 보내기 전에 고객 이름 등은 직접 수정할 수 있어요."
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-admin-blue px-5 py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-admin-red hover:bg-admin-red-soft"
            >
              삭제
            </button>
          )}
        </div>
      </form>
    </AdminCard>
  );
}
