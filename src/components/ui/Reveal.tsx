import { cn } from "@/lib/utils";

// modern-minimal 재디자인: 페이지는 "이미 조판된" 상태로 나타나야 합니다. 전 구간
// 스크롤 페이드는 걷어냈고, 등장은 로드 시 1회 CSS 애니메이션(fadeup)으로만 처리합니다.
//
// 중요: JS(하이드레이션)에 의존하지 않습니다. 예전에는 framer-motion whileInView 로
// 처리해서, 스크립트가 늦게 뜨거나 막히면(예: dev cross-origin, JS 차단) 섹션이
// opacity:0 인 채로 영영 안 보이는 사고가 있었습니다. 이제는 순수 CSS 라
// 스크립트 상태와 무관하게 보이고, prefers-reduced-motion 이면 애니메이션 없이 즉시 표시됩니다.

const FADE = "motion-safe:animate-[fadeup_0.5s_cubic-bezier(0.22,1,0.36,1)_both]";

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "span";
}) {
  const Tag = as;
  return (
    <Tag
      className={cn(FADE, className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  );
}

export function RevealGroup({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  // stagger 는 더 이상 쓰지 않지만(각 항목이 로드 시 함께 등장), 호출부 호환을 위해 받습니다.
  stagger?: number;
  as?: "div" | "ul";
}) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Tag = as;
  return <Tag className={cn(FADE, className)}>{children}</Tag>;
}
