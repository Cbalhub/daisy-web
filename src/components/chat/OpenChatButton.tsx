"use client";

import { openChatWidget } from "@/components/chat/openChat";
import { cn } from "@/lib/utils";

// Button.tsx와 동일한 토스 사이즈 스펙(M=40/12px/15px, L=48/14px/17px)을 씁니다.
const sizes = {
  md: "h-10 rounded-xl px-4 text-[15px] font-semibold",
  lg: "h-12 rounded-[14px] px-5 text-[17px] font-bold",
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
        "inline-flex items-center justify-center gap-2 bg-accent font-medium text-white transition-[transform,opacity,filter] duration-200 ease-out hover:opacity-90 active:scale-[0.97] active:brightness-90 active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
