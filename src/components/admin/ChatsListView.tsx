"use client";

import Link from "next/link";
import { AdminCard } from "@/components/admin/ui/Card";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { BulkBar } from "@/components/admin/BulkBar";

type Row = {
  id: string;
  name: string;
  title: string | null;
  preview: string;
  unread: number;
  status: "OPEN" | "CLOSED";
  lastMessageAt: string;
};

const DATE = new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" });

export function ChatsListView({ conversations }: { conversations: Row[] }) {
  const allIds = conversations.map((c) => c.id);

  async function bulk(ids: string[], action: "close" | "reopen") {
    const res = await fetch("/api/admin/chats/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    });
    return res.ok;
  }

  return (
    <BulkBar
      actions={[
        { label: "선택 대화 닫기", run: (ids) => bulk(ids, "close"), tone: "danger" },
        { label: "다시 열기", run: (ids) => bulk(ids, "reopen") },
      ]}
    >
      {(selected, toggle, _all, toggleAll) => (
        <AdminCard className="p-0">
          <div className="flex items-center gap-2 border-b border-admin-border px-5 py-2.5 text-xs text-admin-muted">
            <input
              type="checkbox"
              checked={selected.size === allIds.length && allIds.length > 0}
              onChange={() => toggleAll(allIds)}
              aria-label="전체 선택"
            />
            전체 선택 ({conversations.length}건)
          </div>
          <ul className="divide-y divide-admin-border">
            {conversations.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-4">
                <input
                  type="checkbox"
                  className="shrink-0"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  aria-label={`${c.name} 선택`}
                />
                <Link href={`/admin/chats/${c.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium text-admin-text">{c.name}</p>
                      {c.title && (
                        <span className="shrink-0 rounded-full bg-admin-content px-2 py-0.5 text-[11px] font-medium text-admin-muted">
                          {c.title}
                        </span>
                      )}
                      {c.status === "CLOSED" && <AdminBadge tone="neutral">닫힘</AdminBadge>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-admin-muted">{c.preview}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-admin-muted">{DATE.format(new Date(c.lastMessageAt))}</span>
                    {c.unread > 0 && <AdminBadge tone="blue">{c.unread}개 안읽음</AdminBadge>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </BulkBar>
  );
}
