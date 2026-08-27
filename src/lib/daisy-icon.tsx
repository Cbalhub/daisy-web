import { ImageResponse } from "next/og";

const PETAL_COLORS = ["#64b5f6", "#ff8dba", "#ffd24d", "#4dd0c1", "#a78bfa", "#ffb74d"];

/**
 * 파비콘/앱 아이콘 공용 렌더러입니다. next/og(Satori)는 임의의 SVG path를
 * 지원하지 않아서, DaisyAsterisk.tsx의 벡터 패스 대신 캡슐형 div를 회전시켜
 * 같은 "꽃잎 6장이 방사형 구조를 이루는" 모양을 재현합니다.
 */
export function renderDaisyIcon(size: number) {
  const petalWidth = size * 0.16;
  const petalHeight = size * 0.42;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", width: size * 0.8, height: size * 0.8, display: "flex" }}>
          {PETAL_COLORS.map((color, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: petalWidth,
                height: petalHeight,
                marginLeft: -petalWidth / 2,
                marginTop: -petalHeight,
                borderRadius: "999px",
                background: color,
                transform: `rotate(${i * 60}deg)`,
                transformOrigin: "50% 100%",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: size * 0.16,
              height: size * 0.16,
              marginLeft: -(size * 0.08),
              marginTop: -(size * 0.08),
              borderRadius: "999px",
              background: "#17191c",
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
