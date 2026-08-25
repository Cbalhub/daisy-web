import { cn } from "@/lib/utils";

// 포트폴리오가 계속 늘어나도 옆 카드와 색이 겹치지 않도록, 톤다운된 색 12개를
// 서로 조합해 132가지 그라디언트 풀을 만듭니다(직접 132개를 나열하는 대신
// 자동 생성 — 색상 톤은 기존 차콜/블루 기조를 유지). 밝은 색끼리 짝지어지면
// 원형 무늬가 흰 선으로는 잘 안 보여서 그 경우만 어두운 선으로 뒤집습니다.
const BASE_COLORS = [
  { hex: "#1d1d1f", light: false }, // 차콜
  { hex: "#424245", light: false }, // 그래파이트
  { hex: "#0071e3", light: false }, // 블루 (포인트)
  { hex: "#0f766e", light: false }, // 틸
  { hex: "#5b4b8a", light: false }, // 바이올렛
  { hex: "#a14a5c", light: false }, // 로즈
  { hex: "#355e46", light: false }, // 포레스트
  { hex: "#3b5166", light: false }, // 슬레이트 블루
  { hex: "#b4650f", light: false }, // 앰버
  { hex: "#e8f2fe", light: true }, // 스카이
  { hex: "#f5f5f7", light: true }, // 오프화이트
  { hex: "#e6dcc3", light: true }, // 샌드
];

const PALETTES = BASE_COLORS.flatMap((from) =>
  BASE_COLORS.filter((to) => to.hex !== from.hex).map((to) => ({
    from: from.hex,
    to: to.hex,
    stroke: from.light && to.light ? "#1d1d1f" : "#ffffff",
  }))
);

export function PlaceholderArt({
  index = 0,
  className,
}: {
  index?: number;
  className?: string;
}) {
  const { from, to, stroke } = PALETTES[index % PALETTES.length];
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl", className)}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-25"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle cx={40 + index * 30} cy="30" r="70" fill="none" stroke={stroke} strokeWidth="1" />
        <circle cx="160" cy="150" r="50" fill="none" stroke={stroke} strokeWidth="1" />
        <line x1="0" y1="200" x2="200" y2="0" stroke={stroke} strokeWidth="0.5" />
      </svg>
    </div>
  );
}
