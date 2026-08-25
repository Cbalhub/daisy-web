"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TONE_DOT: Record<string, string> = {
  neutral: "bg-admin-muted",
  blue: "bg-admin-blue",
  green: "bg-admin-green",
  amber: "bg-admin-amber",
  red: "bg-admin-red",
};

type Option<T extends string> = { value: T; label: string; tone?: keyof typeof TONE_DOT };

export function StatusSelect<T extends string>({
  value,
  options,
  endpoint,
}: {
  value: T;
  options: Option<T>[];
  endpoint: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [open, setOpen] = useState(false);
  const [isPending, setPending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function select(next: T) {
    setOpen(false);
    if (next === current) return;

    const prev = current;
    setCurrent(next);
    setPending(true);

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    setPending(false);
    if (!res.ok) {
      setCurrent(prev);
      return;
    }
    router.refresh();
  }

  const currentOption = options.find((o) => o.value === current);

  return (
    <div ref={rootRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-2.5 py-1.5 text-xs font-medium text-admin-text transition-opacity",
          isPending && "opacity-60"
        )}
      >
        {currentOption?.tone && (
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[currentOption.tone])} />
        )}
        {currentOption?.label ?? current}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={cn("shrink-0 text-admin-muted transition-transform duration-150", open && "rotate-180")}
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 z-20 mt-1.5 w-36 overflow-hidden rounded-lg border border-admin-border bg-admin-surface py-1 shadow-lg"
          >
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => select(opt.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-admin-content",
                    opt.value === current ? "font-semibold text-admin-text" : "text-admin-muted"
                  )}
                >
                  {opt.tone && (
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[opt.tone])} />
                  )}
                  {opt.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
