"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type FaqItem = { question: string; answer: React.ReactNode };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question} className="py-5">
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="font-display text-base font-semibold text-ink md:text-lg">
                {item.question}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-45" : ""}`}
              >
                <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
