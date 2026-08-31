import { ImageResponse } from "next/og";

/**
 * 파비콘/앱 아이콘 — MOVD 마크(O 창): 세이지 배경 + 종이색 링 + 손그림 애스터리스크(6갈래).
 * next/og(Satori)는 flex 레이아웃만 지원하고 absolute 중앙정렬이 불안정해서,
 * 마크 전체를 SVG 문자열로 그린 뒤 <img> 로 한 장 얹습니다. 작은 크기에서 읽히도록
 * 애스터리스크는 링 안쪽에 여유를 두고 6갈래로 단순화합니다.
 */
export function renderMarkIcon(size: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#3f5d3a"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="#f4efe6" stroke-width="8"/>
  <path d="M50 35 V65 M37 42.5 L63 57.5 M63 42.5 L37 57.5"
        stroke="#d4663c" stroke-width="7.5" stroke-linecap="round"/>
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
