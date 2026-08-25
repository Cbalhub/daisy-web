"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateOnly(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 6주(42칸) 그리드로 고정 — 앞뒤 달의 날짜로 빈 칸을 채워서 매달 레이아웃
// 높이가 흔들리지 않게 합니다.
function buildGrid(viewYear: number, viewMonth: number) {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(viewYear, viewMonth, d), inMonth: true });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(viewYear, viewMonth + 1, nextDay), inMonth: false });
    nextDay += 1;
  }
  return cells;
}

/**
 * 브라우저 기본 <input type="date">는 OS/브라우저마다 스타일이 제각각이라
 * 나머지 어드민 UI와 이질감이 컸습니다 — 결제 폼의 별점 선택기와 같은 이유로
 * 직접 그린 팝오버 캘린더로 대체합니다. value/onChange는 기존 date input과
 * 같은 "YYYY-MM-DD" 문자열 규약을 그대로 씁니다.
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "연도-월-일",
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = toDateOnly(value);
  const minDate = toDateOnly(min ?? "");
  const maxDate = toDateOnly(max ?? "");
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // 닫혀있는 동안 값이 바뀌어도 배경에서 굳이 동기화하지 않고, 다시 열 때
  // "지금 선택된 날짜가 있는 달"을 보여주면 충분합니다 — 그래서 effect가
  // 아니라 여는 시점(이벤트 핸들러)에서만 viewDate를 맞춥니다.
  function toggleOpen() {
    setOpen((v) => {
      if (!v) setViewDate(selected ?? new Date());
      return !v;
    });
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const cells = buildGrid(viewDate.getFullYear(), viewDate.getMonth());

  function isDisabled(d: Date) {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  }

  function selectDate(d: Date) {
    if (isDisabled(d)) return;
    onChange(toValue(d));
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-sm text-admin-text outline-none transition-colors focus:border-admin-blue"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0 text-admin-muted">
          <rect x="2.5" y="4" width="15" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2.5 8H17.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6.5 2.5V5.5M13.5 2.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className={value ? undefined : "text-admin-muted"}>{value || placeholder}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-72 rounded-xl border border-admin-border bg-admin-surface p-4 shadow-[0_4px_8px_rgba(15,23,42,0.06),0_24px_48px_-16px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-admin-text">
              {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-admin-muted transition-colors hover:bg-admin-content hover:text-admin-blue"
                aria-label="이전 달"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-admin-muted transition-colors hover:bg-admin-content hover:text-admin-blue"
                aria-label="다음 달"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 text-center text-[11px] text-admin-muted">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-sm">
            {cells.map(({ date, inMonth }, i) => {
              const isSelected = selected !== null && toValue(date) === toValue(selected);
              const isToday = toValue(date) === toValue(new Date());
              const disabled = isDisabled(date);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(date)}
                  className={cn(
                    "mx-auto flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    !inMonth && "text-admin-muted/40",
                    inMonth && !isSelected && "text-admin-text hover:bg-admin-content",
                    isSelected && "bg-admin-blue text-white",
                    isToday && !isSelected && "font-semibold text-admin-blue",
                    disabled && "cursor-not-allowed opacity-30 hover:bg-transparent"
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-admin-border pt-3">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs font-medium text-admin-muted transition-colors hover:text-admin-red"
            >
              삭제
            </button>
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="text-xs font-medium text-admin-blue hover:underline"
            >
              오늘
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
