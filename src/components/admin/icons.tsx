type IconProps = { className?: string };

export function IconGrid({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconTag({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M9.4 2.5H4.5A2 2 0 0 0 2.5 4.5v4.9c0 .53.21 1.04.59 1.41l7.1 7.1a2 2 0 0 0 2.82 0l4.9-4.9a2 2 0 0 0 0-2.82l-7.1-7.1a2 2 0 0 0-1.41-.59Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="6.75" cy="6.75" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconMail({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 5.5L10 11L16.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconCard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 8H17.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 12H8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconImage({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="8" r="1.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 15L8.5 10.5L11 13L14 10L16.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChat({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M3 10a7 7 0 1 1 2.8 5.6L3 17l1.2-3.2A6.96 6.96 0 0 1 3 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="7.5" cy="6.5" r="2.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 16c0-2.9 2.24-5 5-5s5 2.1 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 4.6c1.2.4 2 1.5 2 2.9 0 1.3-.8 2.4-2 2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.5 11.2c1.83.5 3 2.15 3 4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconChart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 17V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 17H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="5.5" y="10" width="2.4" height="5" rx="0.8" fill="currentColor" />
      <rect x="9.8" y="7" width="2.4" height="8" rx="0.8" fill="currentColor" />
      <rect x="14.1" y="4" width="2.4" height="11" rx="0.8" fill="currentColor" />
    </svg>
  );
}

export function IconLogout({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M8 17H4.5A1.5 1.5 0 013 15.5v-11A1.5 1.5 0 014.5 3H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 13.5L17 10L13 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconExternal({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M8.5 4.5H15.5V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 4.5L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 4.5H5.5A1 1 0 004.5 5.5V14.5A1 1 0 005.5 15.5H14.5A1 1 0 0015.5 14.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconStar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 2.5l2.3 4.9 5.2.6-3.9 3.6 1 5.2-4.6-2.6-4.6 2.6 1-5.2-3.9-3.6 5.2-.6L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBolt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M11 2.5L4 11.5H9.5L9 17.5L16 8.5H10.5L11 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 5.5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 10H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 14.5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.5v2.1M10 15.4v2.1M17.5 10h-2.1M4.6 10H2.5M15.1 4.9l-1.5 1.5M6.4 13.6l-1.5 1.5M15.1 15.1l-1.5-1.5M6.4 6.4L4.9 4.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="4" width="15" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 8H17.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 2.5V5.5M13.5 2.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronLeft({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHelp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7.7 8a2.3 2.3 0 1 1 3.3 2.07c-.68.33-1 .77-1 1.43v.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="14.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconDownload({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 3v9.5M6.5 9l3.5 3.5L13.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 14.5v1.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
