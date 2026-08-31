"use client";

import { useCallback, useSyncExternalStore } from "react";

// 라이트/다크 수동 토글. 선택은 localStorage('movd-theme')에 저장하고
// <html data-theme="..."> 로 반영합니다(레이아웃 인라인 스크립트가 초기 로드 시 먼저 적용).
// 선택하지 않은 상태에서는 OS 설정을 따라갑니다.

const THEME_EVENT = "movd-theme-change";

function subscribe(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    mq.removeEventListener("change", callback);
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function resolveTheme(): "dark" | "light" {
  const forced = document.documentElement.dataset.theme;
  if (forced === "dark" || forced === "light") return forced;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, resolveTheme, () => "light" as const);
  const dark = theme === "dark";

  const toggle = useCallback(() => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("movd-theme", next);
    } catch {
      /* localStorage 접근 불가 — 이번 세션에서만 적용 */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, [dark]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "라이트 모드로" : "다크 모드로"}
      className={
        "inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-line text-ink transition-colors hover:bg-paper-dim " +
        (className ?? "")
      }
    >
      {dark ? (
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
          <circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M15.8 4.2l-1.4 1.4M5.6 14.4l-1.4 1.4" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
          <path
            d="M16 11.5A6.5 6.5 0 0 1 8.5 4a6.5 6.5 0 1 0 7.5 7.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
