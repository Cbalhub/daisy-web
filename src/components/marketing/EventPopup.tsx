"use client";

import { useEffect, useState } from "react";
import { EventBannerCard } from "@/components/marketing/EventBannerCard";

// "오늘 하루 보지 않기"를 누른 날짜(YYYY-MM-DD)를 저장. 그 날엔 다시 안 뜨고,
// 자정이 지나면 다시 뜹니다. 그냥 닫기(X·배경)는 아무것도 저장하지 않아서
// 새로고침·새 창이면 또 뜹니다.
const HIDE_KEY = "movd_event_hidden_on";
const AUTO_ADVANCE_MS = 5000;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type EventItem = {
  id: string;
  style: "dark" | "light" | "festive";
  badge: string;
  title: string;
  description: string;
  imageUrl: string;
};

// 등장/퇴장·이벤트 전환 모두 CSS 애니메이션(globals 의 popup-* keyframe)만 씁니다.
// 예전엔 framer-motion 이었는데, 이 팝업이 마케팅 청크로 애니메이션 라이브러리를
// 끌어오는 마지막 지점이었습니다. 퇴장은 closing 상태로 짧게 페이드아웃한 뒤 언마운트.
export function EventPopup({ events }: { events: EventItem[] }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let hiddenToday = false;
    try {
      hiddenToday = localStorage.getItem(HIDE_KEY) === today();
    } catch {
      // 시크릿 모드 등 저장소 접근 불가 — 팝업은 그대로 보여줍니다.
    }
    if (hiddenToday) return;
    const timer = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open || closing || events.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % events.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [open, closing, events.length]);

  // 닫기 애니메이션(0.18s) 뒤 실제로 언마운트합니다.
  function dismiss(remember: boolean) {
    setClosing(true);
    if (remember) {
      try {
        localStorage.setItem(HIDE_KEY, today());
      } catch {
        // 저장 실패해도 이번 화면은 닫힘.
      }
    }
    setTimeout(() => setOpen(false), 180);
  }

  const current = events[index];
  if (!open || !current) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        data-closing={closing || undefined}
        className="popup-backdrop absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={() => dismiss(false)}
      />
      <div
        data-closing={closing || undefined}
        role="dialog"
        aria-modal="true"
        className="popup-card relative w-full max-w-sm"
      >
        <button
          onClick={() => dismiss(false)}
          aria-label="닫기"
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-paper text-ink shadow-[var(--shadow-e2)] transition-transform hover:scale-105"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div key={current.id} className="popup-swap">
          <EventBannerCard
            style={current.style}
            badge={current.badge}
            title={current.title}
            description={current.description}
            imageUrl={current.imageUrl}
          />
        </div>

        {events.length > 1 && (
          <div className="mt-3.5 flex justify-center gap-2">
            {events.map((e, i) => (
              <button
                key={e.id}
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}번째 이벤트 보기`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-5 bg-paper" : "w-2 bg-paper/40"
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs">
          <button
            onClick={() => dismiss(true)}
            className="font-medium text-paper/85 underline-offset-4 hover:text-paper hover:underline"
          >
            오늘 하루 보지 않기
          </button>
          <button
            onClick={() => dismiss(false)}
            className="font-medium text-paper/85 underline-offset-4 hover:text-paper hover:underline"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
