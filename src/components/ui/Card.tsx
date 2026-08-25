import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-paper p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_8px_rgba(15,23,42,0.06),0_24px_48px_-16px_rgba(15,23,42,0.22)]",
        className
      )}
    >
      {children}
    </div>
  );
}
