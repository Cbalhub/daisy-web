"use client";

import { usePathname } from "next/navigation";

// 마케팅 탭 전환 — 경로가 바뀌면 key 가 바뀌어 이 래퍼가 새로 마운트되고, 그때
// CSS 애니메이션(.page-fade)이 처음부터 재생됩니다.
//
// 예전엔 framer-motion 의 AnimatePresence 로 처리했는데, 이 컴포넌트가 마케팅
// 레이아웃에 있어서 모든 마케팅 페이지가 애니메이션 라이브러리(~35KB gzip)를
// 공통 번들로 받고 있었습니다. 단순 페이드라 CSS 로 충분합니다.
//
// SSR HTML 은 <div class="page-fade">…</div> 그대로 — CSS 가 렌더 블로킹이라
// 첫 페인트 전에 규칙이 적용되고, both fill 로 결국 opacity:1 로 끝나므로 JS 가
// 늦거나 막혀도 콘텐츠가 사라지지 않습니다. prefers-reduced-motion 은 globals 의
// 전역 블록이 애니메이션을 사실상 0ms 로 만들어 처리합니다.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  );
}
