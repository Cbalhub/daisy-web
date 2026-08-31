import Link from "next/link";
import { Mark } from "@/components/brand/Mark";
import { cn } from "@/lib/utils";

/**
 * MOVD 워드마크 — Architects Daughter 손글씨 + O 자리에 마크(꽉 찬 버건디 원 + 하늘색 애스터리스크).
 * 글자는 검정(무채색), O 만 색. 단일 굵기 폰트라 굵기는 -webkit-text-stroke 로 살짝 불립니다.
 * tone="inverse" 는 어두운 배경용(글자 종이색).
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
        "inline-flex items-center font-hand leading-none tracking-[0.01em] [-webkit-text-stroke:0.045em_currentColor] [paint-order:stroke_fill]",
        tone === "inverse" ? "text-paper" : "text-ink",
        className
      )}
    >
      M
      <Mark className="mx-[0.015em] inline-block h-[0.9em] w-[0.9em] align-[-0.16em] [-webkit-text-stroke:0]" />
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
