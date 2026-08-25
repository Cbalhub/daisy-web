"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DatePicker } from "@/components/admin/ui/DatePicker";

/**
 * URL의 ?from=&to= 값을 그대로 필터 상태로 씁니다 — SearchBox(?q=)와 같은
 * 패턴으로, 새로고침·뒤로가기에도 유지되고 서버 컴포넌트가 그대로 읽어
 * Prisma where 절에 씁니다. 날짜는 타이핑이 아니라 선택이라 디바운스 없이
 * 바로 반영합니다.
 */
export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function update(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <DatePicker value={from} onChange={(v) => update("from", v)} max={to || undefined} />
      <span className="text-xs text-admin-muted">~</span>
      <DatePicker value={to} onChange={(v) => update("to", v)} min={from || undefined} />
      {(from || to) && (
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            params.delete("from");
            params.delete("to");
            router.replace(`${pathname}?${params.toString()}`);
          }}
          className="text-xs font-medium text-admin-muted transition-colors hover:text-admin-blue"
        >
          초기화
        </button>
      )}
    </div>
  );
}
