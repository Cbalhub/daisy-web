// MOVD 마크 — 워드마크 "MOVD"의 O 자리. O 대신 손그림 애스터리스크 8갈래.
// brand: 버건디(사이트 유일한 색). mono: currentColor (빈 상태·큰 배경 장식용).
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
  const color = variant === "mono" ? "currentColor" : "var(--color-mark)";

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        d="M50 8V92 M8 50H92 M22 22L78 78 M78 22L22 78"
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        filter={filter}
      />
    </svg>
  );
}
