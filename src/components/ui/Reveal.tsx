"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

// modern-minimal 재디자인: 페이지는 "이미 조판된" 상태로 나타나야 합니다. 전 구간
// 스크롤 페이드는 걷어내고(→ anti-slop), 이 컴포넌트는 히어로의 1회성 등장 정도에만
// 씁니다. 이동 폭도 8px로 줄여 거의 눈치채지 못할 만큼 절제했습니다.
const variants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", bounce: 0, duration: 0.4, delay },
  }),
};

// prefers-reduced-motion 이면 이동 없이 즉시 표시합니다.
const staticVariants: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

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
  const reduce = useReducedMotion();
  const MotionTag = as === "span" ? motion.span : motion.div;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      custom={delay}
      variants={reduce ? staticVariants : variants}
    >
      {children}
    </MotionTag>
  );
}

type RevealTag = "div" | "ul";

const GROUP_TAG: Record<RevealTag, typeof motion.div | typeof motion.ul> = {
  div: motion.div,
  ul: motion.ul,
};

export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  as?: RevealTag;
}) {
  const MotionTag = GROUP_TAG[as];
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </MotionTag>
  );
}

type RevealItemTag = "div" | "li";

const ITEM_TAG: Record<RevealItemTag, typeof motion.div | typeof motion.li> = {
  div: motion.div,
  li: motion.li,
};

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: RevealItemTag;
}) {
  const MotionTag = ITEM_TAG[as];
  return (
    <MotionTag className={className} variants={variants}>
      {children}
    </MotionTag>
  );
}
