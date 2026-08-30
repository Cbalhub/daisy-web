import { cn } from "@/lib/utils";

// modern-minimal 재디자인: 섹션마다 대문자 eyebrow를 붙이지 않습니다(anti-slop).
// kicker는 옵션으로 남기되 정말 필요한 1~2곳에서만, 헤딩 바로 위에 수직으로 씁니다.
export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  className,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {kicker && (
        <p className="mb-3 text-xs tracking-tight text-muted">{kicker}</p>
      )}
      <h2 className="font-display text-2xl font-semibold tracking-tight text-balance md:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted">{description}</p>
      )}
    </div>
  );
}
