"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type FaqItem = { question: string; answer: React.ReactNode };

// 펼침 애니메이션은 grid-template-rows 0fr↔1fr 트릭으로 CSS 만. 예전엔 framer-motion
// AnimatePresence 였는데, 이 컴포넌트가 홈(/)과 /faq 에 다 들어가서 두 페이지가
// 애니메이션 라이브러리를 통째로 받고 있었습니다.
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
                className={cn(
                  "shrink-0 text-muted transition-transform duration-200",
                  open && "rotate-45"
                )}
              >
                <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
