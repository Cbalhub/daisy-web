type IconProps = { className?: string };

// 애플 스타일 — 얇은 선(1.5px), 둥근 캡/조인, 단순한 기하학적 형태
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconDocumentCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M9 13.5l2 2 4-4.5" />
    </svg>
  );
}

export function IconLayers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3.5 4 8l8 4.5 8-4.5-8-4.5Z" />
      <path d="M4 12.5l8 4.5 8-4.5" />
      <path d="M4 16.5l8 4.5 8-4.5" />
    </svg>
  );
}

export function IconHeartHand({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 8.3c-1-1.7-3.5-2.1-4.9-.7-1.5 1.5-1.4 3.8.2 5.3L12 17l4.7-4.1c1.6-1.5 1.7-3.8.2-5.3-1.4-1.4-3.9-1-4.9.7Z" />
      <path d="M4 19.5h3.2c.5 0 1-.1 1.4-.3l2.5-1c.6-.2 1.3-.2 1.9 0l2.7 1c.9.3 1.9.1 2.6-.6l2.2-2.1" />
    </svg>
  );
}

export function IconSparkle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3.5c.6 3 2 4.5 5 5-3 .6-4.4 2-5 5-.6-3-2-4.4-5-5 3-.5 4.4-2 5-5Z" />
      <path d="M19 15.5c.3 1.4.9 2 2.3 2.3-1.4.3-2 .9-2.3 2.3-.3-1.4-.9-2-2.3-2.3 1.4-.3 2-.9 2.3-2.3Z" />
    </svg>
  );
}

export function IconPaymentCard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M6.5 14.5h3" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconSliders({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 7h8M16 7h4" />
      <circle cx="13" cy="7" r="2" />
      <path d="M4 17h4M12 17h8" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  );
}

export function IconCross({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6.5 6.5l11 11" />
      <path d="M17.5 6.5l-11 11" />
    </svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
