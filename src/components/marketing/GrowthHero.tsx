"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const PETAL_COLORS = [
  "var(--color-petal-yellow)",
  "var(--color-petal-pink)",
  "var(--color-petal-purple)",
  "var(--color-petal-blue)",
  "var(--color-petal-mint)",
  "var(--color-petal-orange)",
];

const PETALS = PETAL_COLORS.map((color, i) => {
  const angle = (i * 60 * Math.PI) / 180;
  const cx = 60 + Math.cos(angle) * 13;
  const cy = 37 + Math.sin(angle) * 13;
  return { color, cx, cy, angle: i * 60 };
});

// 가운데서 자라는 주인공 옆으로, 이미 핀 작은 데이지 두 송이를 세워 화단처럼
// 보이게 합니다 — 애니메이션 없이 항상 고정으로 떠 있는 배경 장식입니다.
function FlankingDaisy({ x, color }: { x: number; color: string }) {
  return (
    <g transform={`translate(${x} 138)`}>
      <path d="M0 0 V-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-ink-soft" />
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cx="0" cy="-19" rx="2.6" ry="4" fill={color} transform={`rotate(${angle} 0 -14)`} />
      ))}
      <circle cx="0" cy="-14" r="2.2" className="fill-ink" />
    </g>
  );
}

/**
 * 히어로 맨 위 — 화면이 이 섹션 높이(180vh)만큼 스크롤되는 동안 히어로 자체는
 * 화면에 고정(sticky)되어 있고, 그 안에서 씨앗이 뿌리→줄기→봉오리→개화까지
 * 자랍니다. 다 자라면(스크롤이 이 섹션 끝에 닿으면) 자연스럽게 고정이
 * 풀리면서 아래 콘텐츠(서브카피·CTA·채팅 목업)로 넘어갑니다.
 *
 * 이전 두 버전의 문제를 피하려고 `useScroll`을 window 전체가 아니라 이
 * 컴포넌트의 컨테이너(`ref`)에 직접 연결했습니다 — 그래서 growth 진행률이
 * 항상 정확히 "이 섹션을 스크롤하는 동안"의 0→1이고, 뷰포트 크기나 히어로
 * 길이에 따라 어긋나지 않습니다.
 */
export function GrowthHero({
  eyebrow,
  headline,
}: {
  eyebrow: string;
  headline: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: growth } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const seedOpacity = useTransform(growth, [0, 0.16], [1, 0]);
  const seedScale = useTransform(growth, [0, 0.16], [1, 0.4]);
  const rootPath = useTransform(growth, [0.1, 0.28], [0, 1]);
  const stemPath = useTransform(growth, [0.24, 0.58], [0, 1]);
  const leaf1Scale = useTransform(growth, [0.4, 0.54], [0, 1]);
  const leaf1Opacity = useTransform(growth, [0.4, 0.48], [0, 1]);
  const leaf2Scale = useTransform(growth, [0.54, 0.68], [0, 1]);
  const leaf2Opacity = useTransform(growth, [0.54, 0.62], [0, 1]);
  const budScale = useTransform(growth, [0.66, 0.78], [0, 1]);
  const budOpacity = useTransform(growth, [0.66, 0.74], [0, 1]);
  const petalScale = useTransform(growth, [0.78, 1], [0, 1]);
  const petalOpacity = useTransform(growth, [0.78, 0.92], [0, 1]);

  const headlineOpacity = useTransform(growth, [0, 0.1], [0, 1]);
  const headlineY = useTransform(growth, [0, 0.1], [12, 0]);

  return (
    <div ref={ref} className="relative h-[180dvh]">
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center px-4 text-center">
        <svg viewBox="-40 0 200 150" className="h-32 w-auto md:h-40">
          {/* 화단 흙 라인 — 가운데 자라는 주인공 + 양옆 고정 데이지 두 송이가
              한 화단에 서 있는 것처럼 하나로 이어줍니다. */}
          <path
            d="M-30 140 Q60 126 150 140"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            className="text-line"
          />
          <FlankingDaisy x={-12} color="var(--color-petal-pink)" />
          <FlankingDaisy x={132} color="var(--color-petal-mint)" />
          <motion.path
            d="M60 133 C 52 140, 46 143, 40 148"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            className="text-ink-soft"
            style={{ pathLength: rootPath }}
          />
          <motion.path
            d="M60 133 C 68 140, 74 143, 80 148"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            className="text-ink-soft"
            style={{ pathLength: rootPath }}
          />
          <motion.ellipse
            cx="60"
            cy="131"
            rx="7"
            ry="9"
            fill="currentColor"
            className="text-accent"
            style={{ opacity: seedOpacity, scale: seedScale, transformOrigin: "60px 131px" }}
          />
          <motion.path
            d="M60 132 C 57 108, 64 86, 60 40"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            className="text-accent"
            style={{ pathLength: stemPath }}
          />
          <motion.path
            d="M59 95 C 40 92, 27 78, 30 59 C 49 63, 60 78, 59 95 Z"
            fill="currentColor"
            className="text-accent"
            style={{ scale: leaf1Scale, opacity: leaf1Opacity, transformOrigin: "59px 95px" }}
          />
          <motion.path
            d="M61 68 C 80 64, 93 50, 90 31 C 72 36, 61 51, 61 68 Z"
            fill="currentColor"
            className="text-accent"
            style={{ scale: leaf2Scale, opacity: leaf2Opacity, transformOrigin: "61px 68px" }}
          />
          <motion.circle
            cx="60"
            cy="37"
            r="5"
            fill="currentColor"
            className="text-ink"
            style={{ scale: budScale, opacity: budOpacity, transformOrigin: "60px 37px" }}
          />
          {PETALS.map((petal, i) => (
            <motion.ellipse
              key={i}
              cx={petal.cx}
              cy={petal.cy}
              rx="7"
              ry="4.2"
              fill={petal.color}
              transform={`rotate(${petal.angle} ${petal.cx} ${petal.cy})`}
              style={{
                scale: petalScale,
                opacity: petalOpacity,
                transformOrigin: `${petal.cx}px ${petal.cy}px`,
              }}
            />
          ))}
        </svg>

        <motion.p
          style={{ opacity: headlineOpacity, y: headlineY }}
          className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          style={{ opacity: headlineOpacity, y: headlineY }}
          className="mx-auto mt-3 max-w-2xl font-display text-4xl leading-[1.15] font-bold tracking-tight text-balance md:text-5xl"
        >
          {headline}
        </motion.h1>
      </div>
    </div>
  );
}
