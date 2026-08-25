"use client";

import { useId, useState } from "react";

const WIDTH = 600;
const HEIGHT = 120;
const PADDING_Y = 12;

// 점들을 부드러운 곡선으로 잇습니다 — 인접한 두 점 사이를, 그 중점을 지나는
// 2차 베지어로 그려서 별도 스플라인 라이브러리 없이도 각진 꺾임 없는 곡선을 만듭니다.
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = (curr.x + next.x) / 2;
    d += ` Q ${curr.x} ${curr.y} ${midX} ${(curr.y + next.y) / 2}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

// formatValue를 함수 prop으로 받으면 서버 컴포넌트(대시보드 페이지)에서 이
// 클라이언트 컴포넌트로 함수를 그대로 넘기게 되는데, 함수는 서버→클라이언트
// 경계를 건널 수 없는 값이라 런타임 에러가 납니다. 그래서 직렬화 가능한
// prefix 문자열만 받고 포맷팅은 이 안에서 직접 합니다.
export function Sparkline({
  data,
  prefix = "",
}: {
  data: { label: string; value: number }[];
  prefix?: string;
}) {
  const formatValue = (v: number) => `${prefix}${v.toLocaleString("ko-KR")}`;
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  const points = data.map((d, i) => ({
    x: data.length > 1 ? (i / (data.length - 1)) * WIDTH : WIDTH / 2,
    y: HEIGHT - PADDING_Y - (d.value / max) * (HEIGHT - PADDING_Y * 2),
  }));
  const linePath = smoothPath(points);
  const areaPath = `${linePath} L ${WIDTH} ${HEIGHT} L 0 ${HEIGHT} Z`;
  const active = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-28 w-full overflow-visible"
        preserveAspectRatio="none"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-admin-blue)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-admin-blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke="var(--color-admin-blue)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {active && (
          <>
            <line
              x1={active.x}
              y1="0"
              x2={active.x}
              y2={HEIGHT}
              stroke="var(--color-admin-border)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={active.x} cy={active.y} r="4" fill="var(--color-admin-blue)" stroke="white" strokeWidth="2" />
          </>
        )}
        {points.map((p, i) => (
          <rect
            key={i}
            x={data.length > 1 ? (i / data.length) * WIDTH : 0}
            y={0}
            width={WIDTH / Math.max(1, data.length)}
            height={HEIGHT}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}
      </svg>
      {active && hoverIndex !== null && (
        <div
          className="pointer-events-none absolute -top-9 rounded-md bg-admin-text px-2 py-1 text-[10px] whitespace-nowrap text-admin-bg"
          style={{ left: `${(active.x / WIDTH) * 100}%`, transform: "translateX(-50%)" }}
        >
          {data[hoverIndex].label} · {formatValue(data[hoverIndex].value)}
        </div>
      )}
    </div>
  );
}
