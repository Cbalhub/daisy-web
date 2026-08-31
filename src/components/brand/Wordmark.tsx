import Link from "next/link";
import { Mark } from "@/components/brand/Mark";
import { cn } from "@/lib/utils";

/**
 * MOVD 워드마크 — Architects Daughter 손글씨 + O 자리에 마크(세이지 링 + 토마토 애스터리스크).
 * 단일 굵기 폰트라 굵기는 -webkit-text-stroke 로 살짝 불립니다(paint-order 로 획이 글자를
 * 갉아먹지 않게). 기본은 세이지, tone="inverse" 는 어두운 배경용(글자·링을 종이색으로).
 */
export function Wordmark({
  href = "/",
  className,
  tone = "default",
}: {
  href?: string | null;
  className?: string;
  tone?: "default" | "inverse";
}) {
  const inner = (
    <span
      className={cn(
        "inline-flex items-center font-hand leading-none [-webkit-text-stroke:0.03em_currentColor] [paint-order:stroke_fill]",
        tone === "inverse" ? "text-paper" : "text-accent",
        className
      )}
    >
      M
      <Mark className="mx-[0.03em] inline-block h-[0.94em] w-[0.94em] align-[-0.14em] [-webkit-text-stroke:0]" />
      VD
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} aria-label="MOVD 홈" className="inline-flex shrink-0 items-center">
      {inner}
    </Link>
  );
}
