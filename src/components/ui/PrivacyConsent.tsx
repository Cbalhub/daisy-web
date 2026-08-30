"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PRIVACY_POLICY_SECTIONS } from "@/lib/privacyPolicy";

const SCROLL_END_THRESHOLD_PX = 24;

// 체크박스를 직접 클릭해서 동의하는 방식이 아니라, 반드시 "상세보기" 모달을 열어
// 끝까지 스크롤해야만 동의할 수 있도록 강제합니다.
export function PrivacyConsent({ name = "privacyConsent" }: { name?: string }) {
  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = bodyRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_END_THRESHOLD_PX) {
      setScrolledToEnd(true);
    }
  }

  // 내용이 짧아서 스크롤할 필요 자체가 없는 경우(스크롤바 미생성) onScroll이 한 번도
  // 발생하지 않아 확인 버튼이 영영 비활성 상태로 남는 문제를 방지합니다.
  useEffect(() => {
    if (!open) return;
    const el = bodyRef.current;
    if (!el) return;
    if (el.scrollHeight - el.clientHeight < SCROLL_END_THRESHOLD_PX) {
      setScrolledToEnd(true);
    }
  }, [open]);

  function confirm() {
    setConsented(true);
    setOpen(false);
  }

  return (
    <>
      <input type="hidden" name={name} value={consented ? "true" : ""} />

      <button
        type="button"
        onClick={() => {
          setScrolledToEnd(false);
          setOpen(true);
        }}
        className="flex w-full items-center gap-3 rounded-lg border border-line px-3.5 py-3 text-left text-sm transition-colors hover:border-ink/30"
      >
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
            consented ? "border-accent bg-accent text-white" : "border-line text-transparent"
          )}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="flex-1">
          <span className="font-medium text-ink">개인정보 수집 및 이용</span>
          <span className="text-accent"> (필수)</span>
        </span>
        <span className="shrink-0 text-xs text-muted underline underline-offset-2">
          {consented ? "다시 보기" : "상세보기"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-[var(--shadow-e2)]"
            >
              <div className="border-b border-line px-6 py-5">
                <h2 className="font-display text-lg font-semibold tracking-tight">개인정보 수집 및 이용 동의</h2>
                <p className="mt-1 text-xs text-muted">
                  아래 내용을 끝까지 확인해야 동의할 수 있습니다.
                </p>
              </div>

              <div
                ref={bodyRef}
                onScroll={onScroll}
                className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-ink-soft"
              >
                {PRIVACY_POLICY_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h3 className="font-semibold text-ink">{section.title}</h3>
                    {section.body.length > 1 ? (
                      <ul className="mt-1.5 list-disc space-y-1 pl-5">
                        {section.body.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1.5">{section.body[0]}</p>
                    )}
                  </div>
                ))}
                <p className="pt-2 text-center text-xs text-muted">— 끝 —</p>
              </div>

              <div className="border-t border-line px-6 py-4">
                <button
                  type="button"
                  onClick={confirm}
                  disabled={!scrolledToEnd}
                  className="h-11 w-full rounded-[10px] bg-ink text-sm font-semibold text-paper transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {scrolledToEnd ? "동의하고 닫기" : "끝까지 읽어주세요"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
