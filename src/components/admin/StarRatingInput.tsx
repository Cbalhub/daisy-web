"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// 네이티브 <select>는 브라우저마다 제각각인 기본 스타일이 그대로 노출돼
// 나머지 폼과 이질감이 컸습니다. 별점은 원래 "몇 번째 옵션을 고른다"보다
// "별을 몇 개 눌렀다"가 더 자연스러운 조작이라, 드롭다운 대신 클릭 가능한
// 별 5개로 바꿨습니다 — 폼 제출은 기존과 동일하게 hidden input의 name/value로 처리됩니다.
export function StarRatingInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: number | null;
}) {
  const [value, setValue] = useState<number | null>(defaultValue);
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value ?? 0;

  return (
    <div className="mt-1.5 flex items-center gap-3">
      <input type="hidden" name={name} value={value ?? ""} />
      <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onClick={() => setValue((prev) => (prev === n ? null : n))}
            aria-label={`${n}점`}
            aria-pressed={value === n}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            <svg width="22" height="22" viewBox="0 0 20 20">
              <path
                d="M10 2.5l2.3 4.9 5.2.6-3.9 3.6 1 5.2-4.6-2.6-4.6 2.6 1-5.2-3.9-3.6 5.2-.6L10 2.5Z"
                fill={n <= shown ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
                className={cn(n <= shown ? "text-admin-amber" : "text-admin-border")}
              />
            </svg>
          </button>
        ))}
      </div>
      <span className="min-w-[3.5rem] text-xs text-admin-muted">
        {value ? `${value}점` : "없음"}
      </span>
    </div>
  );
}
