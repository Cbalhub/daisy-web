import { ImageResponse } from "next/og";

/**
 * 파비콘/앱 아이콘 — MOVD 마크: 배경 없이(투명) 손그림 애스터리스크 8갈래(버건디).
 * 워드마크의 O 자리와 같은 모양. 탭 색이 뭐든 마크만 떠 보입니다.
 * next/og(Satori)는 flex 레이아웃만 지원하고 absolute 중앙정렬이 불안정해서,
 * 마크 전체를 SVG 문자열로 그린 뒤 <img> 로 얹습니다.
 */
export function renderMarkIcon(size: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <path d="M50 8 V92 M8 50 H92 M22 22 L78 78 M78 22 L22 78"
        fill="none" stroke="#7a2e3e" stroke-width="15" stroke-linecap="round"/>
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
