"use client";

import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

// 폼용 커스텀 셀렉트 — 네이티브 <select> 대신 스타일 가능한 드롭다운.
// 숨은 <input> 에 값을 담아 FormData 로 그대로 제출됩니다.
export function AdminSelect({
  name,
  options,
  defaultValue = "",
  placeholder = "선택",
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative mt-1.5">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg border border-admin-border bg-admin-content px-3 py-2 text-left text-sm text-admin-text outline-none transition-colors focus:border-admin-blue"
      >
        <span className={current ? "" : "text-admin-muted"}>{current?.label ?? placeholder}</span>
        <svg
          viewBox="0 0 12 12"
          className={`h-3 w-3 shrink-0 text-admin-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M3 4.5L6 7.5L9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-admin-border bg-admin-surface py-1 shadow-[var(--shadow-e2)]"
        >
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  setValue(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-admin-text transition-colors hover:bg-admin-content ${
                  o.value === value ? "font-medium" : ""
                }`}
              >
                {o.label}
                {o.value === value && (
                  <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 text-admin-blue" aria-hidden>
                    <path d="M3 7.5L6 10.5L11 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
