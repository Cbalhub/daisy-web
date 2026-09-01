"use client";

import { useRef, useState } from "react";

// 포트폴리오 상세의 화면 목업들을 화살표/스와이프로 넘겨 봅니다.
// translateX 트랜스폼 기반 — 네이티브 스크롤+스냅이 서로 간섭해 흔들리던 문제를 피합니다.
export function MockupCarousel({ panels }: { panels: React.ReactNode[] }) {
  const [i, setI] = useState(0);
  const n = panels.length;
  const startX = useRef<number | null>(null);

  const go = (idx: number) => setI(((idx % n) + n) % n);

  return (
    <div className="rounded-xl border border-line bg-paper-dim">
      <div className="flex items-center gap-2 px-3 pt-4 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={() => go(i - 1)}
          aria-label="이전 화면"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-ink transition-colors hover:bg-paper-dim active:translate-y-px"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          className="flex-1 touch-pan-y overflow-hidden py-4"
          onPointerDown={(e) => {
            startX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (startX.current === null) return;
            const dx = e.clientX - startX.current;
            startX.current = null;
            if (dx < -40) go(i + 1);
            else if (dx > 40) go(i - 1);
          }}
        >
          <div
            className="flex motion-safe:transition-transform motion-safe:duration-[420ms] motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ transform: `translateX(-${i * 100}%)` }}
          >
            {panels.map((p, idx) => (
              <div key={idx} className="flex w-full shrink-0 justify-center px-1">
                <div className="h-[384px] w-full max-w-[380px] overflow-hidden rounded-2xl border border-line/60 shadow-[var(--shadow-e2)] sm:h-[404px]">
                  {p}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => go(i + 1)}
          aria-label="다음 화면"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-ink transition-colors hover:bg-paper-dim active:translate-y-px"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 pb-4">
        <div className="flex gap-1.5">
          {panels.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => go(idx)}
              aria-label={`${idx + 1}번 화면`}
              aria-current={idx === i}
              className={idx === i ? "h-1.5 w-5 rounded-full bg-ink" : "h-1.5 w-1.5 rounded-full bg-line"}
            />
          ))}
        </div>
        <span className="text-xs tabular-nums text-muted">
          {i + 1} / {n}
        </span>
      </div>
    </div>
  );
}
