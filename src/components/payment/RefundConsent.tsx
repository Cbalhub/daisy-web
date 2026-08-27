"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { REFUND_POLICY_SECTIONS } from "@/lib/refundPolicy";

const SCROLL_END_THRESHOLD_PX = 24;

/**
 * PrivacyConsent.tsx와 같은 패턴(반드시 끝까지 스크롤해야 동의 가능)이지만,
 * 이건 회원가입 폼의 hidden input이 아니라 무통장입금 화면의 로컬 state로
 * 관리됩니다 — 그래서 name/hidden input 대신 controlled prop으로 받습니다.
 */
export function RefundConsent({
  consented,
  onChange,
}: {
  consented: boolean;
  onChange: (consented: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
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
    onChange(true);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setScrolledToEnd(false);
          setOpen(true);
        }}
        className="flex w-full items-center gap-3 rounded-xl border border-line px-4 py-3 text-left text-sm transition-colors hover:border-ink"
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
          <span className="font-medium text-ink">환불 정책 확인</span>
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
              className="flex max-h-[80vh] w-full max-w-lg flex-col bg-paper shadow-2xl"
            >
              <div className="border-b border-line px-6 py-5">
                <h2 className="font-display text-lg">환불 정책 확인</h2>
                <p className="mt-1 text-xs text-muted">
                  아래 내용을 끝까지 확인해야 입금 완료 처리를 진행할 수 있습니다.
                </p>
              </div>

              <div
                ref={bodyRef}
                onScroll={onScroll}
                className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-ink-soft"
              >
                {REFUND_POLICY_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h3 className="font-semibold text-ink">{section.title}</h3>
                    {section.body.map((line) => (
                      <p key={line} className="mt-1.5">
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
                <p className="pt-2 text-center text-xs text-muted">— 끝 —</p>
              </div>

              <div className="border-t border-line px-6 py-4">
                <button
                  type="button"
                  onClick={confirm}
                  disabled={!scrolledToEnd}
                  className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {scrolledToEnd ? "확인했어요" : "끝까지 읽어주세요"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
