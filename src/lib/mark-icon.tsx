import { ImageResponse } from "next/og";

const SAGE = "#3f5d3a";
const RING = "#f1e3e0";
const TOMATO = "#d4663c";

/**
 * 파비콘/앱 아이콘 — MOVD 마크(O 창). next/og(Satori)는 임의 SVG path를 지원하지 않아서
 * 세이지 배경 + 둥근 테두리 div(링) + 회전한 막대 4개(애스터리스크 8갈래)로 구성합니다.
 */
export function renderMarkIcon(size: number) {
  const ring = size * 0.84;
  const ringW = size * 0.13;
  const barLen = size * 0.52;
  const barW = size * 0.12;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: SAGE,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: ring,
            height: ring,
            borderRadius: "50%",
            border: `${ringW}px solid ${RING}`,
          }}
        />
        {[0, 45, 90, 135].map((deg) => (
          <div
            key={deg}
            style={{
              position: "absolute",
              width: barLen,
              height: barW,
              borderRadius: barW,
              background: TOMATO,
              transform: `rotate(${deg}deg)`,
            }}
          />
        ))}
      </div>
    ),
    { width: size, height: size }
  );
}
