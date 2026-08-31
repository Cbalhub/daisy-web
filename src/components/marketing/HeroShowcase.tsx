"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardPanel } from "@/components/marketing/DashboardPanel";
import {
  ChatMiniCard,
  AutomationCard,
  WebhookFlow,
} from "@/components/marketing/ProductMocks";

// 히어로 쇼케이스 — 저희가 만들어 쓰는 도구들을 코드로 재현한 패널.
// 데스크톱(lg+): 한 장씩 넘겨 보는 슬라이더, 4.5초 자동 넘김(hover 시 정지).
// 모바일: 그냥 세로로 쌓아서 보여줍니다(슬라이더·자동넘김 없음).

const SLIDES = [
  { label: "관리자 대시보드", node: <DashboardPanel /> },
  { label: "실시간 상담", node: <ChatMiniCard /> },
  { label: "자동화 배치", node: <AutomationCard /> },
  { label: "웹훅 연동", node: <WebhookFlow /> },
];

const INTERVAL_MS = 4500;

export function HeroShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);
  const iRef = useRef(0);
  useEffect(() => {
    iRef.current = i;
  }, [i]);

  function scrollTo(idx: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = ((idx % SLIDES.length) + SLIDES.length) % SLIDES.length;
    const child = track.children[clamped] as HTMLElement | undefined;
    if (child) track.scrollTo({ left: child.offsetLeft - track.offsetLeft, behavior: "smooth" });
    setI(clamped);
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    setI(Math.max(0, Math.min(SLIDES.length - 1, idx)));
  }

  useEffect(() => {
    if (held) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => scrollTo(iRef.current + 1), INTERVAL_MS);
    return () => clearInterval(t);
  }, [held]);

  return (
    <figure
      className="m-0 motion-safe:animate-[fadeup_0.5s_ease-out]"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
    >
      <div className="mb-3 hidden items-center justify-between gap-4 lg:flex">
        <p className="text-[13px] font-semibold text-ink">{SLIDES[i].label}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-muted">
            {i + 1} / {SLIDES.length}
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => scrollTo(i - 1)}
              aria-label="이전"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-paper-dim"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollTo(i + 1)}
              aria-label="다음"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-paper-dim"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
                <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex flex-col gap-5 lg:snap-x lg:snap-mandatory lg:flex-row lg:gap-4 lg:overflow-x-auto lg:scroll-smooth lg:[-ms-overflow-style:none] lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((s) => (
          <div key={s.label} className="w-full shrink-0 lg:snap-start">
            {s.node}
          </div>
        ))}
      </div>

      <div className="mt-3 hidden gap-1.5 lg:flex">
        {SLIDES.map((s, idx) => (
          <button
            key={s.label}
            type="button"
            onClick={() => scrollTo(idx)}
            aria-label={`${idx + 1}번 슬라이드`}
            aria-current={idx === i}
            className={idx === i ? "h-1 w-6 rounded-full bg-ink" : "h-1 w-1.5 rounded-full bg-line"}
          />
        ))}
      </div>

      <figcaption className="mt-3 text-xs leading-relaxed text-muted">
        전부 저희가 만들어 쓰는 도구예요. 이 사이트의 관리자 화면, 상담 채팅, 자동화도 여기서 돌아갑니다.
      </figcaption>
    </figure>
  );
}
