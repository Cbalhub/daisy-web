"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * URL의 ?q= 값을 그대로 검색 상태로 씁니다 — 새로고침·뒤로가기에도 검색어가
 * 유지되고, 실제 필터링은 서버 컴포넌트가 이 값을 읽어 Prisma where 절에 씁니다.
 */
export function SearchBox({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    // 검색어 입력이 멈추고 300ms 후에만 URL을 갱신합니다 — 매 키 입력마다
    // 서버 컴포넌트를 다시 그리면 느리고 히스토리도 지저분해집니다.
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
    // pathname/router/searchParams는 이 debounce가 반응해야 할 대상이 아니라
    // "지금 URL이 뭔지" 읽기 위한 값이라 의도적으로 의존성에서 제외합니다 —
    // 넣으면 우리가 방금 만든 URL 변경이 자기 자신을 다시 트리거합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <svg
        width="15"
        height="15"
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted"
      >
        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 14L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-xs rounded-lg border border-admin-border bg-admin-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-admin-blue"
      />
    </div>
  );
}
