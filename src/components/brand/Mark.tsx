// MOVD 마크 — 워드마크 "MOVD"의 O 자리. 링(currentColor) + 손그림 애스터리스크 8갈래.
// #rough 왜곡 필터로 손그림 느낌. brand: 애스터리스크는 하늘색(--color-mark).
// mono: 전부 currentColor (빈 상태·큰 배경 장식용).

export function Mark({
  className,
  variant = "brand",
  rough = true,
}: {
  className?: string;
  variant?: "brand" | "mono";
  rough?: boolean;
}) {
  const filter = rough ? "url(#rough)" : undefined;
  const star = variant === "mono" ? "currentColor" : "var(--color-mark)";

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g filter={filter} fill="none" strokeLinecap="round">
        <circle cx="50" cy="52" r="31" stroke="currentColor" strokeWidth="13" />
        <path
          d="M50 37V67M35 52H65M40 42L60 62M60 42L40 62"
          stroke={star}
          strokeWidth="6.5"
        />
      </g>
    </svg>
  );
}
