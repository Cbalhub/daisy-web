"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value;

  return (
    <div className="flex items-center gap-1.5" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onClick={() => onChange(n)}
          aria-label={`${n}점`}
          aria-pressed={value === n}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <svg width="28" height="28" viewBox="0 0 20 20">
            <path
              d="M10 2.5l2.3 4.9 5.2.6-3.9 3.6 1 5.2-4.6-2.6-4.6 2.6 1-5.2-3.9-3.6 5.2-.6L10 2.5Z"
              fill={n <= shown ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
              className={cn(n <= shown ? "text-accent" : "text-line")}
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
