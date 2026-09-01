"use client";

import { useEffect, useState } from "react";
import { DashboardPanel } from "@/components/marketing/DashboardPanel";
import { ChatMiniCard, AutomationCard, WebhookFlow } from "@/components/marketing/ProductMocks";

// 히어로 쇼케이스 — 저희가 만들어 쓰는 도구들을 코드로 재현한 패널.
// 데스크톱(lg+): 고정 높이 프레임 안에서 translateX 로 넘기는 슬라이더 (포트폴리오
// 상세의 목업 캐러셀과 같은 방식), 5초 자동 넘김(hover 시 정지).
// 모바일: 세로로 쌓아서 보여줍니다.

const SLIDES = [
  { label: "관리자 대시보드", node: <DashboardPanel /> },
  { label: "실시간 상담", node: <ChatMiniCard /> },
  { label: "자동화 배치", node: <AutomationCard /> },
  { label: "웹훅 연동", node: <WebhookFlow /> },
];

const INTERVAL_MS = 5000;

export function HeroShowcase() {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);
  const n = SLIDES.length;
  const go = (idx: number) => setI(((idx % n) + n) % n);

  useEffect(() => {
    if (held) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), INTERVAL_MS);
    return () => clearInterval(t);
  }, [held, n]);

  return (
    <figure className="m-0 motion-safe:animate-[fadeup_0.5s_ease-out]">
      {/* 모바일 — 세로 스택 */}
      <div className="space-y-5 lg:hidden">
        {SLIDES.map((s) => (
          <div key={s.label}>{s.node}</div>
        ))}
      </div>

      {/* 데스크톱 — 프레임 슬라이더 */}
      <div
        className="hidden rounded-2xl border border-line bg-paper-dim lg:block"
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocusCapture={() => setHeld(true)}
        onBlurCapture={() => setHeld(false)}
      >
        <div className="flex items-center gap-3 px-5 pt-5">
          <button
            type="button"
            onClick={() => go(i - 1)}
            aria-label="이전"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-ink transition-colors hover:bg-paper-dim active:translate-y-px"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
              <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="flex-1 overflow-hidden">
            <div
              className="flex h-[440px] items-stretch motion-safe:transition-transform motion-safe:duration-[480ms] motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{ transform: `translateX(-${i * 100}%)` }}
            >
              {SLIDES.map((s) => (
                <div key={s.label} className="flex w-full shrink-0 items-stretch justify-center px-1">
                  <div className="w-full max-w-[440px]">{s.node}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => go(i + 1)}
            aria-label="다음"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-ink transition-colors hover:bg-paper-dim active:translate-y-px"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
              <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4 pb-5">
          <p className="text-[13px] font-semibold text-ink">{SLIDES[i].label}</p>
          <span className="text-line">·</span>
          <div className="flex gap-1.5">
            {SLIDES.map((s, idx) => (
              <button
                key={s.label}
                type="button"
                onClick={() => go(idx)}
                aria-label={`${idx + 1}번 슬라이드`}
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

      <figcaption className="mt-3 text-xs leading-relaxed text-muted">
        전부 저희가 만들어 쓰는 도구예요. 이 사이트의 관리자 화면, 상담 채팅, 자동화도 여기서 돌아갑니다.
      </figcaption>
    </figure>
  );
}
