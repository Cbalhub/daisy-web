"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/Card";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { BulkBar } from "@/components/admin/BulkBar";
import { useToast } from "@/components/ui/Toast";
import { INQUIRY_STATUS_LABEL } from "@/lib/admin/status";
import type { InquiryStatus } from "@prisma/client";

type Row = {
  id: string;
  name: string;
  email: string;
  budget: string | null;
  preferredTimeline: string | null;
  message: string;
  status: InquiryStatus;
  hasAttachment: boolean;
  attachmentUrl: string | null;
  conversationId: string | null;
  createdAt: string;
};

const DATE = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const STATUS_OPTIONS: InquiryStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "CLOSED"];

export function InquiriesView({ inquiries }: { inquiries: Row[] }) {
  const router = useRouter();
  const toast = useToast();
  const allIds = inquiries.map((i) => i.id);

  async function setStatus(id: string, status: InquiryStatus) {
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast("상태를 바꿨어요", "success");
      router.refresh();
    } else {
      toast("상태 변경에 실패했어요", "error");
    }
  }

  async function bulkStatus(ids: string[], status: InquiryStatus) {
    const res = await fetch("/api/admin/inquiries/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status }),
    });
    return res.ok;
  }

  return (
    <BulkBar
      actions={[
        { label: "연락함으로", run: (ids) => bulkStatus(ids, "CONTACTED") },
        { label: "가망으로", run: (ids) => bulkStatus(ids, "QUALIFIED") },
        { label: "종료로", run: (ids) => bulkStatus(ids, "CLOSED"), tone: "danger" },
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
            전체 선택 ({inquiries.length}건)
          </div>
          <ul className="divide-y divide-admin-border">
            {inquiries.map((i) => (
              <li key={i.id} className="flex gap-3 px-5 py-4">
                <input
                  type="checkbox"
                  className="mt-1 shrink-0"
                  checked={selected.has(i.id)}
                  onChange={() => toggle(i.id)}
                  aria-label={`${i.name} 선택`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-admin-text">{i.name}</span>
                    <span className="text-xs text-admin-muted">{i.email}</span>
                    {i.budget && <AdminBadge tone="neutral">예산 {i.budget}</AdminBadge>}
                    {i.preferredTimeline && (
                      <AdminBadge tone="neutral">일정 {i.preferredTimeline}</AdminBadge>
                    )}
                    {i.hasAttachment && i.attachmentUrl && (
                      <a
                        href={i.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-admin-blue hover:underline"
                      >
                        📎 첨부
                      </a>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-sm text-admin-text">
                    {i.message}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-admin-muted">
                    <span>{DATE.format(new Date(i.createdAt))}</span>
                    {i.conversationId && (
                      <Link
                        href={`/admin/chats/${i.conversationId}`}
                        className="text-admin-blue hover:underline"
                      >
                        대화 열기 →
                      </Link>
                    )}
                  </div>
                </div>
                <select
                  value={i.status}
                  onChange={(e) => setStatus(i.id, e.target.value as InquiryStatus)}
                  className="h-8 shrink-0 self-start rounded-md border border-admin-border bg-admin-surface px-2 text-xs text-admin-text outline-none focus:border-admin-blue"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {INQUIRY_STATUS_LABEL[s].label}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </BulkBar>
  );
}
