"use client";

import { usePathname } from "next/navigation";

// 마케팅 페이지 전환 — 탭을 옮길 때 콘텐츠가 살짝 아래에서 페이드인.
// key={pathname} 로 라우트가 바뀌면 이 div 가 리마운트되며 CSS 애니메이션이 다시 재생됩니다.
//
// 순수 CSS 인 이유: 예전엔 framer-motion 이 initial={{opacity:0}} 를 SSR 에 넣어서,
// 스크립트가 늦게/안 뜨면(dev cross-origin, JS 차단 등) 페이지 전체가 안 보였습니다.
// 이제는 스크립트와 무관하게 보이고, prefers-reduced-motion 이면 애니메이션이 빠집니다.

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="motion-safe:animate-[pagein_0.24s_cubic-bezier(0.23,1,0.32,1)]">
      {children}
    </div>
  );
}
