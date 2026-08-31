import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const alt = "MOVD — 제대로 만드는 소프트웨어 개발 파트너";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  // next/og(satori)는 woff2를 지원하지 않으므로, 본문용 가변 폰트 대신
  // pretendard 패키지의 정적 굵기(otf)를 씁니다.
  const [bold, extraBold] = await Promise.all([
    readFile(
      path.join(process.cwd(), "node_modules/pretendard/dist/public/static/Pretendard-Bold.otf")
    ),
    readFile(
      path.join(
        process.cwd(),
        "node_modules/pretendard/dist/public/static/Pretendard-ExtraBold.otf"
      )
    ),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: "#232c1d",
          color: "#faf5ea",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 800, letterSpacing: "0.02em", color: "#9cc08f" }}>
          MOVD
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.15,
          }}
        >
          돈 받고 만드는 이상, 제대로 만듭니다
        </div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 26, color: "rgba(250,245,234,0.55)" }}>
          소프트웨어 개발 외주 · 챗봇 · 업무 자동화
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: bold, style: "normal", weight: 700 },
        { name: "Pretendard", data: extraBold, style: "normal", weight: 800 },
      ],
    }
  );
}
