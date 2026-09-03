// 마이페이지 기본 프로필 캐릭터 — 둥근 블롭에 점 눈 두 개와 작은 미소, 머리에서
// 새싹처럼 돋은 버건디 애스터리스크(로고 색). 무채색 브랜드에 맞춘 납작한 SVG라
// 어떤 크기로도 선명하고, 토큰(--color-*)이 다크모드에서 알아서 뒤집힙니다.
export function DefaultAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden role="img">
      <circle cx="50" cy="50" r="50" fill="var(--color-paper-dim)" />
      {/* 새싹 애스터리스크 — 머리 위로 살짝 겹침 */}
      <path
        d="M50 12V32 M41 22H59 M43.5 15.5L56.5 28.5 M56.5 15.5L43.5 28.5"
        fill="none"
        stroke="var(--color-mark)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* 본체 — 둥근 블롭 */}
      <path
        d="M50 30c17 0 30 14 30 32v18a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6V62c0-18 13-32 30-32z"
        fill="var(--color-ink)"
      />
      {/* 눈 */}
      <circle cx="41" cy="60" r="3.6" fill="var(--color-paper)" />
      <circle cx="59" cy="60" r="3.6" fill="var(--color-paper)" />
      {/* 미소 */}
      <path
        d="M43 71c3 4 11 4 14 0"
        fill="none"
        stroke="var(--color-paper)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
