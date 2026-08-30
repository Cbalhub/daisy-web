import { cn } from "@/lib/utils";

// 포트폴리오 이미지가 없을 때 — 화려한 그라데이션 대신, 무채색 UI 와이어프레임 한 장.
// "이건 소프트웨어다"라는 인상만 조용히 줍니다.
export function PlaceholderArt({
  label,
  className,
}: {
  index?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-line bg-paper-dim", className)}>
      <svg
        viewBox="0 0 320 200"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full text-line"
        aria-hidden
      >
        <rect x="0" y="0" width="320" height="34" fill="var(--color-paper)" />
        <line x1="0" y1="34" x2="320" y2="34" stroke="currentColor" />
        <circle cx="18" cy="17" r="4" fill="var(--color-accent)" opacity="0.5" />
        <rect x="30" y="13" width="70" height="8" rx="2" fill="currentColor" />
        <rect x="20" y="52" width="120" height="10" rx="2" fill="currentColor" />
        <rect x="20" y="72" width="180" height="8" rx="2" fill="currentColor" opacity="0.7" />
        <rect x="20" y="100" width="84" height="60" rx="4" fill="var(--color-paper)" stroke="currentColor" />
        <rect x="118" y="100" width="84" height="60" rx="4" fill="var(--color-paper)" stroke="currentColor" />
        <rect x="216" y="100" width="84" height="60" rx="4" fill="var(--color-paper)" stroke="currentColor" />
        <rect x="30" y="112" width="40" height="6" rx="2" fill="currentColor" />
        <rect x="30" y="128" width="56" height="14" rx="2" fill="var(--color-accent)" opacity="0.35" />
      </svg>
      {label && (
        <span className="absolute bottom-2.5 right-3 text-[11px] font-medium text-muted">{label}</span>
      )}
    </div>
  );
}
