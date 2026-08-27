const PETAL_D = "M50,50 C44,38 44,22 50,14 C56,22 56,38 50,50 Z";

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300];

const COLOR_ORDER = [
  "var(--color-petal-blue)",
  "var(--color-petal-pink)",
  "var(--color-petal-yellow)",
  "var(--color-petal-mint)",
  "var(--color-petal-purple)",
  "var(--color-petal-orange)",
];

/**
 * DAISY 심볼 — 애스터리스크(*) 옆에 꽃을 붙인 게 아니라, 꽃잎 6장 자체가
 * 애스터리스크의 방사형 구조를 이룹니다. 16px 파비콘까지 알아볼 수 있도록
 * 꽃잎 사이 네거티브 스페이스를 넉넉히 두고, 실제 식물 묘사 대신 단순한
 * vesica(끝이 뾰족한 렌즈) 형태로 단순화했습니다.
 *
 * variant="color"         — 꽃잎마다 다른 브랜드 색 + 잉크색 중심 (밝은 배경용)
 * variant="color-inverse" — 꽃잎은 그대로, 중심만 흰색 (어두운 배경용 — 잉크 중심은 bg-ink 위에서 안 보임)
 * variant="mono"          — currentColor 단색 (파비콘, 작은 UI, 어느 배경이든 겸용)
 */
export function DaisyAsterisk({
  className,
  variant = "color",
}: {
  className?: string;
  variant?: "color" | "color-inverse" | "mono";
}) {
  const isColor = variant === "color" || variant === "color-inverse";
  const centerFill = variant === "mono" ? "currentColor" : variant === "color-inverse" ? "#ffffff" : "var(--color-ink)";

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {PETAL_ANGLES.map((angle, i) => (
        <path
          key={angle}
          d={PETAL_D}
          fill={isColor ? COLOR_ORDER[i] : "currentColor"}
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="6.5" fill={centerFill} />
    </svg>
  );
}
