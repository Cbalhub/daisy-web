"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export type BulkAction = {
  label: string;
  // 선택된 id 목록으로 서버 요청. 성공하면 true 를 돌려줍니다(토스트/새로고침은 BulkBar 가).
  run: (ids: string[]) => Promise<boolean>;
  tone?: "default" | "danger";
};

/**
 * 목록에 체크박스 다중 선택 + 하단 고정 액션 바를 붙입니다.
 * children 은 (selected, toggle) 를 받아 각 행에 체크박스를 그립니다.
 */
export function BulkBar({
  actions,
  children,
}: {
  actions: BulkAction[];
  children: (selected: Set<string>, toggle: (id: string) => void, allChecked: boolean, toggleAll: (ids: string[]) => void) => React.ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (ids: string[]) =>
    setSelected((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));

  async function fire(action: BulkAction) {
    if (running || selected.size === 0) return;
    setRunning(true);
    try {
      const ok = await action.run([...selected]);
      if (ok) {
        toast(`${selected.size}건 처리했어요`, "success");
        setSelected(new Set());
        router.refresh();
      } else {
        toast("일부 항목을 처리하지 못했어요", "error");
      }
    } catch {
      toast("처리에 실패했어요", "error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      {children(selected, toggle, false, toggleAll)}

      {selected.size > 0 && (
        <div className="sticky bottom-4 z-20 mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-admin-border bg-admin-surface px-4 py-3 shadow-lg">
          <span className="text-sm font-medium text-admin-text">{selected.size}건 선택</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => fire(a)}
                disabled={running}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-40 ${
                  a.tone === "danger"
                    ? "bg-admin-red-soft text-admin-red"
                    : "bg-admin-blue text-white"
                }`}
              >
                {a.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-admin-muted hover:text-admin-text"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </>
  );
}
