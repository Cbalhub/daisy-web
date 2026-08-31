"use client";

import { openChatWidget } from "@/components/chat/openChat";
import { cn } from "@/lib/utils";

// Button.tsx와 동일한 사이즈·모서리 반경 스펙을 씁니다.
const sizes = {
  md: "h-10 rounded-[10px] px-4 text-[14px] font-semibold",
  lg: "h-12 rounded-xl px-5 text-[15px] font-semibold",
};

export function OpenChatButton({
  children,
  size = "lg",
  className,
}: {
  children: React.ReactNode;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={openChatWidget}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap bg-accent font-semibold text-on-accent shadow-[var(--shadow-e1)] transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-px hover:bg-accent-bright hover:shadow-[var(--shadow-e2)] active:translate-y-px active:shadow-none active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
