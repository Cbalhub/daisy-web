"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { StarRatingInput } from "@/components/marketing/StarRatingInput";
import { IconCheck } from "@/components/ui/icons";

export function ReviewSubmitForm({ orderToken }: { orderToken: string }) {
  const toast = useToast();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      toast("별점을 선택해 주세요", "error");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/review/${orderToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, role, quote, rating }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? "제출에 실패했습니다.", "error");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-line bg-paper-dim px-6 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <IconCheck className="h-6 w-6" />
        </div>
        <p className="mt-4 font-semibold">후기가 제출됐어요</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          확인 후 사이트에 게시할게요. 소중한 시간 내주셔서 감사합니다!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium text-ink">별점</label>
        <div className="mt-2">
          <StarRatingInput value={rating} onChange={setRating} />
        </div>
      </div>

      <div>
        <label htmlFor="company" className="text-sm font-medium text-ink">
          공개될 이름 / 소속
        </label>
        <input
          id="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="예: 이커머스 스타트업 대표님, 카페 사장님 — 원하시는 만큼만 밝혀주세요"
          maxLength={100}
          required
          className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>

      <div>
        <label htmlFor="role" className="text-sm font-medium text-ink">
          역할 <span className="font-normal text-muted">(선택)</span>
        </label>
        <input
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="예: 마케팅 담당"
          maxLength={50}
          className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
        />
      </div>

      <div>
        <label htmlFor="quote" className="text-sm font-medium text-ink">
          후기 내용
        </label>
        <textarea
          id="quote"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          rows={5}
          maxLength={1000}
          required
          placeholder="프로젝트를 진행하시면서 느낀 점을 자유롭게 남겨주세요."
          className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm leading-relaxed outline-none transition-colors focus:border-ink"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-[10px] bg-accent text-sm font-semibold text-white transition-[background-color,transform] duration-200 ease-out hover:bg-accent/90 active:scale-[0.98] active:duration-100 disabled:pointer-events-none disabled:opacity-40"
      >
        {loading ? "제출 중..." : "후기 제출하기"}
      </button>
    </form>
  );
}
