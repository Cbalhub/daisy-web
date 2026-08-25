"use client";

import { motion, type Variants } from "framer-motion";

const variants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    // 애플 스타일 기본 스프링: 오버슈트 없는 critically-damped — 자연스럽지만 튀지 않음
    transition: { type: "spring", bounce: 0, duration: 0.5, delay },
  }),
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
  const MotionTag = as === "span" ? motion.span : motion.div;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      custom={delay}
      variants={variants}
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
