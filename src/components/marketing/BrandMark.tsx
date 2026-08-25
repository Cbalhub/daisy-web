// 브랜드 가이드라인의 로고 마크(둥근 O + 거품)를 직접 벡터로 옮긴 컴포넌트입니다.
// 원본 제공 파일(01_APP_ICON/*.svg)은 실제로는 SVG 태그 안에 PNG를 base64로
// 통째로 박아넣은 "가짜 SVG"라 300~400KB나 되고 확대하면 흐려집니다 — 그래서
// 브랜드보드 레퍼런스를 보고 진짜 벡터 패스로 다시 그렸습니다. currentColor를
// 써서 어디에 놓이든(네비게이션, 히어로, 다크 배경 CTA 등) 문맥에 맞게 색을
// 바꿀 수 있습니다.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <circle cx="36" cy="64" r="17" stroke="currentColor" strokeWidth="9" />
      <circle cx="59" cy="27" r="8.5" fill="currentColor" />
      <circle cx="76" cy="39" r="5" fill="currentColor" />
      <circle cx="68" cy="50" r="3.2" fill="currentColor" />
      <circle cx="78" cy="58" r="1.6" fill="currentColor" />
    </svg>
  );
}
