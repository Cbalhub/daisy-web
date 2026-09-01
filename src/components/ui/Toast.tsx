"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Tone = "default" | "success" | "error";
type ToastEntry = { id: number; message: string; tone: Tone; leaving: boolean };
type ToastFn = (message: string, tone?: Tone) => void;

const ToastContext = createContext<ToastFn | null>(null);

/**
 * 사이트 전체(고객/관리자 페이지 공용)에서 쓰는 토스트입니다. 다크 칩 스타일을 그냥
 * 리터럴 색으로 고정해서, ink/paper든 admin-* 토큰이든 어느 화면 위에 떠도
 * 항상 같은 모습으로 보이게 합니다.
 *
 * 이 Provider 는 루트 레이아웃에 있어 모든 페이지에 로드됩니다. 예전엔 등장/퇴장을
 * framer-motion 으로 처리했는데, 그것 때문에 사이트 전체가 애니메이션 라이브러리를
 * 공통 번들로 받고 있었습니다. 지금은 CSS(.toast-item)만 씁니다 — 등장은 keyframe,
 * 퇴장은 [data-leaving] 클래스로 짧게 페이드아웃한 뒤 DOM 에서 제거합니다.
 */
export function useToast() {
  const push = useContext(ToastContext);
  if (!push) throw new Error("useToast는 <ToastProvider> 안에서만 사용할 수 있습니다.");
  return push;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const push = useCallback<ToastFn>((message, tone = "default") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone, leaving: false }]);
    // 2.4초 뒤 퇴장 애니메이션을 걸고, 0.2초 뒤 실제로 제거합니다.
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 200);
    }, 2400);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[200] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            data-leaving={t.leaving || undefined}
            className="toast-item pointer-events-auto flex items-center gap-2.5 rounded-[14px] bg-neutral-900 py-2.5 pr-4 pl-2.5 text-sm font-medium text-white shadow-lg"
          >
            <ToneIcon tone={t.tone} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToneIcon({ tone }: { tone: Tone }) {
  if (tone === "success") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success">
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
          <path
            d="M2.5 7.2L5.4 10L11.5 3.8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (tone === "error") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-error">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
          <path
            d="M2.5 2.5L11.5 11.5M11.5 2.5L2.5 11.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
      <svg width="3" height="3" viewBox="0 0 6 6" fill="none">
        <circle cx="3" cy="3" r="3" fill="white" />
      </svg>
    </span>
  );
}
