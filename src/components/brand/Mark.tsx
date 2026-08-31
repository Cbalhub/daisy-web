// MOVD 마크 — 워드마크 "MOVD"의 O 자리. brand: 꽉 채운 버건디 원 + 손그림 애스터리스크
// 8갈래(하늘색). 사이트 유일한 색. mono: 링 아웃라인만 currentColor (빈 상태·큰 배경 장식용).
// #rough 왜곡 필터로 손그림 느낌(가장자리가 살짝 흔들림).

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

  if (variant === "mono") {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden>
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="currentColor"
          strokeWidth="13"
          filter={filter}
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g filter={filter}>
        <circle cx="50" cy="50" r="46" fill="var(--color-mark)" />
        <path
          d="M50 27V73M27 50H73M35 35L65 65M65 35L35 65"
          fill="none"
          stroke="var(--color-mark-2)"
          strokeWidth="8.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
