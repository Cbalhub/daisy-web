"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { totalDays, toScopeText, type EstimateGroup } from "@/lib/estimate-format";

// ── 새 견적 생성 ──────────────────────────────────────────────────
export function AddEstimate() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [sourceText, setSourceText] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || sourceText.trim().length < 20) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: sourceText.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "견적 초안 생성에 실패했습니다.");
      toast("견적 초안이 생성됐어요", "success");
      router.push(`/admin/estimate/${body.estimate.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "견적 초안 생성에 실패했습니다.", "error");
      setLoading(false);
    }
  }

  return (
    <AdminCard>
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="text-xs font-medium text-admin-muted">
          고객 문의 원문 <span className="text-admin-muted/70">(채팅·메일 내용을 그대로 붙여넣기)</span>
        </label>
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={10}
          maxLength={20000}
          placeholder="안녕하세요. Discord 종합 봇 개발 외주 문의드립니다. 보안 + 게임 + 이벤트 + 게임머니 + 음악 기능을 포함한…"
          className="w-full resize-y rounded-lg border border-admin-border bg-admin-surface px-3.5 py-3 text-sm leading-relaxed text-admin-text outline-none focus:border-admin-blue"
        />
        <button
          type="submit"
          disabled={loading || sourceText.trim().length < 20}
          className="rounded-lg bg-admin-blue px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "분석 중… (20~40초)" : "작업 분해 · 견적 초안"}
        </button>
      </form>
    </AdminCard>
  );
}

// ── 견적 편집기 ──────────────────────────────────────────────────
type Draft = {
  id: string;
  projectName: string;
  summary: string;
  notes: string;
  groups: EstimateGroup[];
  model: string;
  sourceText: string;
};

export function EstimateEditor({ draft }: { draft: Draft }) {
  const router = useRouter();
  const toast = useToast();
  const [projectName, setProjectName] = useState(draft.projectName);
  const [summary, setSummary] = useState(draft.summary);
  const [notes, setNotes] = useState(draft.notes);
  const [groups, setGroups] = useState<EstimateGroup[]>(draft.groups);
  const [saving, setSaving] = useState(false);
  const [showSource, setShowSource] = useState(false);

  const total = useMemo(() => totalDays(groups), [groups]);
  const dirty =
    projectName !== draft.projectName ||
    summary !== draft.summary ||
    notes !== draft.notes ||
    JSON.stringify(groups) !== JSON.stringify(draft.groups);

  function updateItem(gi: number, ii: number, patch: Partial<EstimateGroup["items"][number]>) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i !== gi ? g : { ...g, items: g.items.map((it, j) => (j !== ii ? it : { ...it, ...patch })) }
      )
    );
  }
  function addItem(gi: number) {
    setGroups((prev) =>
      prev.map((g, i) => (i !== gi ? g : { ...g, items: [...g.items, { name: "", detail: "", days: 0 }] }))
    );
  }
  function removeItem(gi: number, ii: number) {
    setGroups((prev) =>
      prev.map((g, i) => (i !== gi ? g : { ...g, items: g.items.filter((_, j) => j !== ii) }))
    );
  }
  function updateGroup(gi: number, patch: Partial<Pick<EstimateGroup, "name" | "note">>) {
    setGroups((prev) => prev.map((g, i) => (i !== gi ? g : { ...g, ...patch })));
  }
  function removeGroup(gi: number) {
    if (!confirm("이 그룹을 통째로 지울까요?")) return;
    setGroups((prev) => prev.filter((_, i) => i !== gi));
  }
  function addGroup() {
    setGroups((prev) => [...prev, { name: "새 그룹", note: "", items: [{ name: "", detail: "", days: 0 }] }]);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/estimate/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, summary, notes, groups }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b?.error ?? "저장에 실패했습니다.");
      toast("저장됐어요", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "저장에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("이 견적을 삭제할까요?")) return;
    const res = await fetch(`/api/admin/estimate/${draft.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("삭제했어요", "success");
      router.push("/admin/estimate");
    } else {
      toast("삭제에 실패했습니다.", "error");
    }
  }

  async function copyScope() {
    const text = toScopeText({ projectName, summary, groups, notes });
    try {
      await navigator.clipboard.writeText(text);
      toast("계약서 '용역 범위' 칸에 붙여넣으세요", "success");
    } catch {
      toast("복사에 실패했어요. 아래 미리보기에서 직접 선택해 주세요.", "error");
    }
  }

  const scopePreview = toScopeText({ projectName, summary, groups, notes });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-lg bg-admin-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
        <button
          onClick={copyScope}
          className="rounded-lg border border-admin-border px-3.5 py-2 text-sm font-medium text-admin-text transition-colors hover:border-admin-blue hover:text-admin-blue"
        >
          계약서 범위로 복사
        </button>
        <span className="ml-auto rounded-lg bg-admin-content px-3 py-2 text-sm font-semibold tabular-nums text-admin-text">
          합계 {total % 1 === 0 ? total : total.toFixed(1)}일
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
        <div>
          <label className="text-xs font-medium text-admin-muted">프로젝트명</label>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            maxLength={80}
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-surface px-3.5 py-2.5 text-sm font-medium text-admin-text outline-none focus:border-admin-blue"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-admin-muted">한 줄 요약</label>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={500}
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-surface px-3.5 py-2.5 text-sm text-admin-text outline-none focus:border-admin-blue"
          />
        </div>
      </div>

      <div className="space-y-3">
        {groups.map((g, gi) => {
          const gDays = g.items.reduce((a, it) => a + (it.days || 0), 0);
          return (
            <div key={gi} className="rounded-xl border border-admin-border bg-admin-surface p-3.5">
              <div className="flex items-center gap-2">
                <input
                  value={g.name}
                  onChange={(e) => updateGroup(gi, { name: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-admin-content px-3 py-2 text-sm font-semibold text-admin-text outline-none focus:border-admin-blue"
                />
                <span className="shrink-0 text-xs font-medium tabular-nums text-admin-muted">
                  {gDays % 1 === 0 ? gDays : gDays.toFixed(1)}일
                </span>
                <button
                  onClick={() => removeGroup(gi)}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-admin-muted hover:text-admin-red"
                >
                  그룹 삭제
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {g.items.map((it, ii) => (
                  <div key={ii} className="grid gap-2 sm:grid-cols-[minmax(0,160px)_1fr_72px_auto] sm:items-start">
                    <input
                      value={it.name}
                      onChange={(e) => updateItem(gi, ii, { name: e.target.value })}
                      placeholder="항목"
                      className="rounded-lg border border-admin-border bg-admin-content px-3 py-2 text-sm text-admin-text outline-none focus:border-admin-blue"
                    />
                    <input
                      value={it.detail}
                      onChange={(e) => updateItem(gi, ii, { detail: e.target.value })}
                      placeholder="무엇을 만드는지"
                      className="rounded-lg border border-admin-border bg-admin-content px-3 py-2 text-sm text-admin-text outline-none focus:border-admin-blue"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={it.days}
                      onChange={(e) => updateItem(gi, ii, { days: Math.max(0, Number(e.target.value) || 0) })}
                      className="rounded-lg border border-admin-border bg-admin-content px-2 py-2 text-right text-sm tabular-nums text-admin-text outline-none focus:border-admin-blue"
                    />
                    <button
                      onClick={() => removeItem(gi, ii)}
                      className="justify-self-start rounded-lg px-2 py-2 text-xs text-admin-muted hover:text-admin-red sm:justify-self-auto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addItem(gi)}
                className="mt-2 text-xs font-medium text-admin-blue hover:underline"
              >
                + 항목 추가
              </button>
            </div>
          );
        })}
        <button
          onClick={addGroup}
          className="rounded-lg border border-dashed border-admin-border px-3.5 py-2 text-sm font-medium text-admin-muted transition-colors hover:border-admin-blue hover:text-admin-blue"
        >
          + 그룹 추가
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-admin-muted">가정 · 제외 범위 · 별도 비용</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          maxLength={4000}
          className="mt-1.5 w-full resize-y rounded-lg border border-admin-border bg-admin-surface px-3.5 py-2.5 text-sm leading-relaxed text-admin-text outline-none focus:border-admin-blue"
        />
      </div>

      <details className="rounded-lg border border-admin-border bg-admin-content px-4 py-3">
        <summary className="cursor-pointer text-xs font-medium text-admin-muted">계약서 범위 미리보기</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[12px] leading-relaxed text-admin-text">
          {scopePreview}
        </pre>
      </details>

      <div className="flex flex-wrap items-center gap-2 border-t border-admin-border pt-4">
        <button
          onClick={() => setShowSource((v) => !v)}
          className="rounded-lg border border-admin-border px-3.5 py-2 text-sm font-medium text-admin-text transition-colors hover:border-admin-blue"
        >
          {showSource ? "원문 숨기기" : "고객 원문 보기"}
        </button>
        <button
          onClick={remove}
          className="rounded-lg border border-admin-border px-3.5 py-2 text-sm font-medium text-admin-red transition-colors hover:border-admin-red"
        >
          삭제
        </button>
        <span className="ml-auto text-[11px] text-admin-muted">
          작업일수 추정: {draft.model || "Gemini"} · 금액은 직접 산정하세요
        </span>
      </div>
      {showSource && (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-admin-border bg-admin-surface p-4 text-[12px] leading-relaxed text-admin-muted">
          {draft.sourceText}
        </pre>
      )}
    </div>
  );
}
