"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/Card";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { IconTag } from "@/components/admin/icons";
import { EventBannerCard } from "@/components/marketing/EventBannerCard";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type EventStyle = "dark" | "light" | "festive";

type EventItem = {
  id: string;
  enabled: boolean;
  order: number;
  style: EventStyle;
  badge: string;
  title: string;
  description: string;
  imageUrl: string;
};

const STYLE_OPTIONS: { value: EventStyle; label: string; swatch: string }[] = [
  { value: "dark", label: "다크 포스터", swatch: "bg-ink" },
  { value: "light", label: "밝은 카드", swatch: "bg-paper border border-admin-border" },
  { value: "festive", label: "컬러풀 축제형", swatch: "bg-[linear-gradient(155deg,#f2b134_0%,#c9821f_100%)]" },
];

const EMPTY_DRAFT = {
  badge: "",
  style: "dark" as EventStyle,
  title: "",
  description: "",
  imageUrl: "",
  enabled: true,
};

export function EventManager({ events }: { events: EventItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [mode, setMode] = useState<"text" | "image">("text");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  function startCreate() {
    setDraft(EMPTY_DRAFT);
    setMode("text");
    setEditingId("new");
  }

  function startEdit(event: EventItem) {
    setDraft({
      badge: event.badge,
      style: event.style,
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl,
      enabled: event.enabled,
    });
    setMode(event.imageUrl ? "image" : "text");
    setEditingId(event.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/events/upload", { method: "POST", body: formData });
    setUploading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? "업로드에 실패했습니다.", "error");
      return;
    }
    const { url } = await res.json();
    setDraft((d) => ({ ...d, imageUrl: url }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    // 이미지 모드일 땐 이미지만, 문구 모드일 땐 문구만 서버에 보냅니다 —
    // 모드를 바꿔가며 이것저것 입력해도 서로 뒤섞여 저장되지 않게 합니다.
    const payload =
      mode === "image"
        ? { ...draft, badge: "", title: draft.title, description: "" }
        : { ...draft, imageUrl: "" };

    setLoading(true);
    const isNew = editingId === "new";
    const res = await fetch(isNew ? "/api/admin/events" : `/api/admin/events/${editingId}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? "저장에 실패했습니다.", "error");
      return;
    }

    toast(isNew ? "이벤트를 추가했어요" : "저장됐어요", "success");
    cancelEdit();
    router.refresh();
  }

  async function toggleEnabled(event: EventItem) {
    const res = await fetch(`/api/admin/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !event.enabled }),
    });
    if (!res.ok) {
      toast("변경에 실패했습니다.", "error");
      return;
    }
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/events/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      toast("삭제에 실패했습니다.", "error");
      return;
    }
    toast("삭제했어요", "success");
    setDeleteTarget(null);
    router.refresh();
  }

  const isFormOpen = editingId !== null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {isFormOpen && (
          <AdminCard>
            <form onSubmit={save}>
              <p className="text-sm font-semibold text-admin-text">
                {editingId === "new" ? "새 이벤트" : "이벤트 수정"}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-lg bg-admin-content p-1">
                {(["text", "image"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-md py-2 text-xs font-medium transition-colors",
                      mode === m
                        ? "bg-admin-surface text-admin-text shadow-sm"
                        : "text-admin-muted hover:text-admin-text"
                    )}
                  >
                    {m === "text" ? "문구로 만들기" : "이미지 업로드"}
                  </button>
                ))}
              </div>

              {mode === "text" ? (
                <>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-admin-muted">디자인 스타일</label>
                    <div className="mt-1.5 grid grid-cols-3 gap-2">
                      {STYLE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, style: opt.value }))}
                          className={cn(
                            "rounded-lg border-2 p-2 text-center transition-colors",
                            draft.style === opt.value ? "border-admin-blue" : "border-transparent"
                          )}
                        >
                          <span className={cn("block h-8 w-full rounded-md", opt.swatch)} />
                          <span className="mt-1.5 block text-[11px] text-admin-muted">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs font-medium text-admin-muted">
                      원형 배지 문구 <span className="font-normal text-admin-muted/70">예: 20%</span>
                    </label>
                    <input
                      value={draft.badge}
                      onChange={(e) => setDraft((d) => ({ ...d, badge: e.target.value }))}
                      maxLength={12}
                      placeholder="20%"
                      className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-admin-muted">
                      제목 <span className="font-normal text-admin-muted/70">예: 오픈 이벤트</span>
                    </label>
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      maxLength={60}
                      placeholder="오픈 이벤트"
                      className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-admin-muted">
                      설명{" "}
                      <span className="font-normal text-admin-muted/70">
                        예: 지금 문의하시면 전체 할인 20%
                      </span>
                    </label>
                    <input
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      maxLength={120}
                      placeholder="지금 문의하시면 전체 할인 20%"
                      className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
                    />
                  </div>
                </>
              ) : (
                <div className="mt-4">
                  <label className="text-xs font-medium text-admin-muted">
                    배너 이미지{" "}
                    <span className="font-normal text-admin-muted/70">
                      미리캔버스 등에서 만든 이미지를 그대로 올려요 (JPG/PNG/WEBP/GIF, 8MB 이하)
                    </span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={onPickImage}
                    className="hidden"
                  />
                  {draft.imageUrl ? (
                    <div className="mt-2 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={draft.imageUrl}
                        alt="업로드한 이벤트 이미지"
                        className="h-20 w-20 rounded-lg border border-admin-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-medium text-admin-blue hover:underline"
                      >
                        다른 이미지로 바꾸기
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="mt-2 flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-admin-border text-xs text-admin-muted transition-colors hover:border-admin-blue hover:text-admin-blue disabled:opacity-50"
                    >
                      {uploading ? "업로드 중..." : "클릭해서 이미지 선택"}
                    </button>
                  )}
                </div>
              )}

              <label className="mt-4 flex items-center gap-2 text-sm text-admin-text">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))}
                  className="h-4 w-4 rounded border-admin-border accent-admin-blue"
                />
                바로 노출하기
              </label>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading || (mode === "image" && !draft.imageUrl)}
                  className="rounded-lg bg-admin-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg px-4 py-2 text-sm text-admin-muted hover:bg-admin-content"
                >
                  취소
                </button>
              </div>
            </form>
          </AdminCard>
        )}

        <AdminCard className="p-0">
          <div className="flex items-center justify-between px-5 pt-5 pb-1">
            <p className="text-sm font-semibold text-admin-text">이벤트 목록</p>
            {!isFormOpen && (
              <button
                onClick={startCreate}
                className="rounded-lg bg-admin-blue px-3.5 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
              >
                + 새 이벤트
              </button>
            )}
          </div>
          {events.length === 0 ? (
            <AdminEmptyState
              icon={<IconTag className="h-6 w-6" />}
              title="등록된 이벤트가 없습니다."
              description="이벤트를 추가하고 노출을 켜면 사이트 진입 시 팝업으로 보여요."
            />
          ) : (
            <ul className="mt-2 divide-y divide-admin-border">
              {events.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-admin-text">
                      {event.imageUrl ? (
                        <span className="text-admin-muted">이미지 배너 · </span>
                      ) : (
                        <>
                          {event.badge && <span className="text-admin-blue">{event.badge}</span>}
                          {event.badge && event.title && " · "}
                        </>
                      )}
                      {event.title || "(제목 없음)"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-admin-muted">{event.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleEnabled(event)}
                      role="switch"
                      aria-checked={event.enabled}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                        event.enabled ? "bg-admin-blue" : "bg-admin-border"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          event.enabled ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => startEdit(event)}
                      className="text-xs font-medium text-admin-muted hover:text-admin-blue"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => setDeleteTarget(event)}
                      className="text-xs font-medium text-admin-muted hover:text-admin-red"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium text-admin-muted">
          {isFormOpen ? "이렇게 보여요" : "카드 하나를 추가하거나 수정하면 여기 미리보기가 떠요"}
        </p>
        {isFormOpen && (
          <div className="rounded-2xl bg-admin-content p-8">
            <EventBannerCard
              style={draft.style}
              badge={draft.badge}
              title={draft.title || (mode === "text" ? "제목을 입력해 보세요" : "")}
              description={draft.description || (mode === "text" ? "설명을 입력해 보세요" : "")}
              imageUrl={mode === "image" ? draft.imageUrl : undefined}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="이벤트를 삭제할까요?"
        description={
          deleteTarget ? `"${deleteTarget.title || deleteTarget.badge}" 이벤트가 삭제됩니다.` : undefined
        }
        confirmLabel="삭제"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
