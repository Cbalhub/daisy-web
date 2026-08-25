"use client";

import { openChatWidget } from "@/components/chat/openChat";
import { cn } from "@/lib/utils";

const sizes = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
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
        "inline-flex items-center justify-center gap-2 rounded-full bg-accent font-medium text-white transition-[transform,opacity] duration-300 ease-out hover:opacity-90 active:scale-[0.97] active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  );
}
