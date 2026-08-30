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
        // 균일한 표면. hover 시 보더가 accent 쪽으로 옅게 물들고 얕은 그림자가 얹힙니다.
        "rounded-2xl border border-line bg-paper p-6 transition-[border-color,box-shadow] duration-200 ease-out hover:border-accent/25 hover:shadow-[var(--shadow-e2)]",
        className
      )}
    >
      {children}
    </div>
  );
}
