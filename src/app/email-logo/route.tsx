import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
// 자주 안 바뀌므로 길게 캐시. 이메일 클라이언트/프록시가 이미지를 리페치할 때 부담 없게.
export const revalidate = 86400;

// 이메일 헤더용 MOVD 워드마크 PNG.
// 이메일 클라이언트는 웹폰트도 인라인 SVG도 못 쓰므로 이미지로 내보냅니다.
// 사이트 워드마크와 동일 — Architects Daughter 손글씨 + O 자리에 버건디 애스터리스크.
const ASTERISK =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
  '<path d="M50 8 V92 M8 50 H92 M22 22 L78 78 M78 22 L22 78" fill="none" stroke="#7a2e3e" stroke-width="14" stroke-linecap="round"/>' +
  "</svg>";

export async function GET() {
  const hand = await readFile(
    path.join(process.cwd(), "src/fonts/ArchitectsDaughter-Regular.ttf")
  );
  const mark = `data:image/svg+xml;base64,${Buffer.from(ASTERISK).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
      >
        <span style={{ fontFamily: "Hand", fontSize: 84, color: "#191919", lineHeight: 1 }}>M</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mark} width={50} height={50} alt="" style={{ margin: "0 4px" }} />
        <span style={{ fontFamily: "Hand", fontSize: 84, color: "#191919", lineHeight: 1 }}>VD</span>
      </div>
    ),
    {
      width: 300,
      height: 110,
      fonts: [{ name: "Hand", data: hand, weight: 400, style: "normal" }],
    }
  );
}
