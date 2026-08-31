import { ImageResponse } from "next/og";

/**
 * 파비콘/앱 아이콘 — MOVD 마크(O 창): 크림 바탕 + 세이지 링 + 손그림 애스터리스크(하늘색, 6갈래).
 * 워드마크의 O 를 그대로 오려낸 모양. next/og(Satori)는 flex 레이아웃만 지원하고
 * absolute 중앙정렬이 불안정해서, 마크 전체를 SVG 문자열로 그린 뒤 <img> 로 얹습니다.
 */
export function renderMarkIcon(size: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#f4efe6"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="#3f5d3a" stroke-width="8"/>
  <path d="M50 35 V65 M37 42.5 L63 57.5 M63 42.5 L37 57.5"
        stroke="#5b9fd0" stroke-width="7.5" stroke-linecap="round"/>
</svg>`;
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={size} height={size} src={dataUri} alt="MOVD" />
      </div>
    ),
    { width: size, height: size }
  );
}
