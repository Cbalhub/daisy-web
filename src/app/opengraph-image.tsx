import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const alt = "OverCook — 완성까지 끓어오르는 개발 파트너";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  // next/og(satori)는 woff2를 지원하지 않으므로, 사이트 본문에 쓰는 가변 폰트 대신
  // 정적 굵기(otf)를 제공하는 pretendard 패키지의 파일을 사용합니다.
  const fontData = await readFile(
    path.join(
      process.cwd(),
      "node_modules/pretendard/dist/public/static/Pretendard-Bold.otf"
    )
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#1d1d1f",
          color: "#ffffff",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 700 }}>
          OverCook<span style={{ color: "#3d41c6" }}>.</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.25,
            maxWidth: 920,
          }}
        >
          설익은 채로 내보내지 않습니다.
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 26, color: "rgba(255,255,255,0.6)" }}>
          업무 자동화 · 챗봇 개발 외주 — OverCook
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Pretendard", data: fontData, style: "normal", weight: 700 }],
    }
  );
}
