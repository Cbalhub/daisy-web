import { ImageResponse } from "next/og";

/**
 * 파비콘/앱 아이콘 — MOVD 마크(O): 배경 없이(투명) 꽉 채운 버건디 원 + 하늘색 애스터리스크 8갈래.
 * 워드마크의 O 를 그대로 오려낸 모양. 탭 색이 뭐든 마크만 떠 보입니다.
 * next/og(Satori)는 flex 레이아웃만 지원하고 absolute 중앙정렬이 불안정해서,
 * 마크 전체를 SVG 문자열로 그린 뒤 <img> 로 얹습니다.
 */
export function renderMarkIcon(size: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="44" fill="#7a2e3e"/>
  <path d="M50 26 V74 M26 50 H74 M34 34 L66 66 M66 34 L34 66"
        stroke="#5b9fd0" stroke-width="9" stroke-linecap="round"/>
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
