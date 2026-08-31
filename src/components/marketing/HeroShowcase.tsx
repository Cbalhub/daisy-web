"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardPanel } from "@/components/marketing/DashboardPanel";
import {
  ChatMiniCard,
  AutomationCard,
  WebhookFlow,
} from "@/components/marketing/ProductMocks";

// 히어로 쇼케이스 — 저희가 만들어 쓰는 도구들을 코드로 재현한 패널을 한 장씩 넘겨 봅니다.
// 4.5초마다 천천히 넘어가고, 마우스를 올리거나 조작하면 멈춥니다.
// (실제 고객 작업 스크린샷이 준비되면 SLIDES 를 그 이미지로 교체하면 됩니다.)

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
  iRef.current = i;

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
    if (!track) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    setI(Math.max(0, Math.min(SLIDES.length - 1, idx)));
  }

  useEffect(() => {
    if (held) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
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
      <div className="mb-3 flex items-center justify-between gap-4">
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
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((s) => (
          <div key={s.label} className="flex min-h-[24rem] w-full shrink-0 snap-start items-start">
            <div className="w-full">{s.node}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-1.5">
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
