"use client";

import { useRef, useState } from "react";

// 포트폴리오 상세의 화면 목업들을 화살표/스와이프로 넘겨 봅니다.
// 한 번에 한 장(세로 카드), 좌우 화살표 + 카운터 + 점 인디케이터.
export function MockupCarousel({ panels }: { panels: React.ReactNode[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const n = panels.length;

  function go(idx: number) {
    const clamped = ((idx % n) + n) % n;
    const track = trackRef.current;
    const child = track?.children[clamped] as HTMLElement | undefined;
    if (track && child) track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: "smooth" });
    setI(clamped);
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setI(Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / track.clientWidth))));
  }

  return (
    <div className="rounded-xl border border-line bg-paper-dim">
      <div className="flex items-center gap-2 px-4 pt-4 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={() => go(i - 1)}
          aria-label="이전 화면"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-ink transition-colors hover:bg-paper-dim"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex flex-1 snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth py-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          {panels.map((p, idx) => (
            <div key={idx} className="flex w-full shrink-0 snap-center justify-center">
              <div className="aspect-[9/15] w-full max-w-[260px] overflow-hidden rounded-2xl border border-line/60 shadow-[var(--shadow-e2)]">
                {p}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(i + 1)}
          aria-label="다음 화면"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-ink transition-colors hover:bg-paper-dim"
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
