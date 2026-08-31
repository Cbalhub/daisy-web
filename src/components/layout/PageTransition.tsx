"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

// 마케팅 페이지 전환 — 탭을 옮길 때 콘텐츠가 살짝 아래에서 페이드인.
// exit 애니메이션은 App Router 서버 트리와 안정적이지 않아 등장만 처리합니다.
// prefers-reduced-motion 이면 애니메이션 없이 즉시.

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
