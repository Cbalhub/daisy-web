"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// 마케팅 페이지 전환 — 탭을 옮길 때 콘텐츠가 살짝 아래에서 페이드인.
//
// `AnimatePresence initial={false}` 가 핵심: 첫 렌더(SSR 포함)는 애니메이션 없이
// 최종 상태(보이는 상태)로 렌더하므로, 스크립트가 늦거나 막혀도 콘텐츠가 안 사라집니다.
// 이후 라우트가 바뀔 때만 새 화면이 페이드인합니다. (exit 애니메이션은 App Router
// 서버 트리와 안 맞아 등장만 처리)
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
