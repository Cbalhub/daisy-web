"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EventBannerCard } from "@/components/marketing/EventBannerCard";

const DISMISS_KEY = "overcook_event_popup_dismissed";
const AUTO_ADVANCE_MS = 5000;

type EventItem = {
  id: string;
  style: "dark" | "light" | "festive";
  badge: string;
  title: string;
  description: string;
  imageUrl: string;
};

/**
 * 세션당(브라우저 탭을 새로 열 때마다) 한 번만 뜨도록 sessionStorage를 씁니다.
 * 이벤트가 여러 개면 카드 안에서 점(dot) 페이지네이션으로 넘겨봅니다.
 */
export function EventPopup({ events }: { events: EventItem[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // 시크릿 모드 등에서 sessionStorage 접근이 막혀도 팝업 자체는 보여줍니다.
    }
    const timer = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open || events.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % events.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [open, events.length]);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // 저장 실패해도 이번 화면은 이미 닫혔으니 무시합니다.
    }
  }

  const current = events[index];
  if (!current) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm"
          >
            <button
              onClick={close}
              aria-label="닫기"
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-paper text-ink shadow-[0_4px_8px_rgba(15,23,42,0.12)] transition-transform hover:scale-105"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
              >
                <EventBannerCard
                  style={current.style}
                  badge={current.badge}
                  title={current.title}
                  description={current.description}
                  imageUrl={current.imageUrl}
                />
              </motion.div>
            </AnimatePresence>

            {events.length > 1 && (
              <div className="mt-4 flex justify-center gap-2">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
