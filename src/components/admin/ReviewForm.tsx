"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/Card";
import { StarRatingInput } from "@/components/admin/StarRatingInput";
import { useToast } from "@/components/ui/Toast";

type Initial = {
  id?: string;
  company: string;
  role: string;
  quote: string;
  rating: number | null;
  order: number;
  published: boolean;
};

const EMPTY: Initial = {
  company: "",
  role: "",
  quote: "",
  rating: null,
  order: 0,
  published: false,
};

export function ReviewForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const toast = useToast();
  const data = initial ?? EMPTY;
  const isEdit = Boolean(data.id);

  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const ratingRaw = String(form.get("rating") ?? "");
    const payload = {
      company: String(form.get("company") ?? ""),
      role: String(form.get("role") ?? ""),
      quote: String(form.get("quote") ?? ""),
      rating: ratingRaw ? Number(ratingRaw) : undefined,
      order: Number(form.get("order") ?? 0),
      published: form.get("published") === "on",
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/reviews/${data.id}` : "/api/admin/reviews",
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
      router.push("/admin/reviews");
    } catch (err) {
      toast(err instanceof Error ? err.message : "저장에 실패했습니다.", "error");
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!data.id || !confirm("이 후기를 삭제할까요?")) return;
    await fetch(`/api/admin/reviews/${data.id}`, { method: "DELETE" });
    toast("삭제됐어요", "success");
    router.push("/admin/reviews");
  }

  return (
    <AdminCard>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="회사명" name="company" defaultValue={data.company} required />
          <Field label="직함 (선택)" name="role" defaultValue={data.role} />
        </div>
        <div>
          <label className="text-xs font-medium text-admin-muted">후기 내용</label>
          <textarea
            name="quote"
            defaultValue={data.quote}
            required
            rows={4}
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
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
          <div>
            <label className="text-xs font-medium text-admin-muted">
              평점 <span className="font-normal normal-case text-admin-muted/70">(실제로 받은 점수만 — 모르면 비워두세요)</span>
            </label>
            <StarRatingInput name="rating" defaultValue={data.rating} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-admin-text">
          <input type="checkbox" name="published" defaultChecked={data.published} />
          공개 게시
        </label>

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

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-admin-muted">
        {label} {required && <span className="text-admin-red">*</span>}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
      />
    </div>
  );
}
