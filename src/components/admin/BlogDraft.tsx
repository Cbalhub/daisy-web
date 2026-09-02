"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { BLOG_PLATFORM_OPTIONS } from "@/lib/admin/blog-labels";
import { BLOG_TONES } from "@/lib/validation/blog";
import type { BlogPlatform } from "@prisma/client";

const TONE_LABEL: Record<string, string> = { 담백: "담백", 친근: "친근", 전문: "전문" };

// ── 새 초안 생성 폼 ───────────────────────────────────────────────
export function AddBlogDraft() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [platform, setPlatform] = useState<BlogPlatform>("NAVER");
  const [tone, setTone] = useState<string>("담백");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          keywords: keywords
            .split(/[,\n]/)
            .map((k) => k.trim())
            .filter(Boolean),
          platform,
          tone,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? "초안 생성에 실패했습니다.");
      toast("초안이 생성됐어요", "success");
      router.push(`/admin/blog/${body.draft.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "초안 생성에 실패했습니다.", "error");
      setLoading(false);
    }
  }

  return (
    <AdminCard>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-admin-muted">주제</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            minLength={3}
            maxLength={200}
            placeholder="예: 소상공인이 카카오톡 챗봇을 도입할 때 드는 비용"
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-surface px-3.5 py-2.5 text-sm text-admin-text outline-none focus:border-admin-blue"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-admin-muted">
            핵심 키워드 <span className="text-admin-muted/70">(쉼표로 구분, 선택)</span>
          </label>
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="카카오톡 챗봇, 챗봇 개발 비용, 자동응답"
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-surface px-3.5 py-2.5 text-sm text-admin-text outline-none focus:border-admin-blue"
          />
        </div>
        <div className="flex flex-wrap gap-6">
          <div>
            <label className="text-xs font-medium text-admin-muted">플랫폼</label>
            <div className="mt-1.5 inline-flex rounded-full bg-admin-content p-1">
              {BLOG_PLATFORM_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setPlatform(o.value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    platform === o.value
                      ? "bg-admin-surface text-admin-text shadow-sm"
                      : "text-admin-muted hover:text-admin-text"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-admin-muted">톤</label>
            <div className="mt-1.5 inline-flex rounded-full bg-admin-content p-1">
              {BLOG_TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    tone === t
                      ? "bg-admin-surface text-admin-text shadow-sm"
                      : "text-admin-muted hover:text-admin-text"
                  }`}
                >
                  {TONE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || topic.trim().length < 3}
          className="rounded-lg bg-admin-blue px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "생성 중… (20~40초)" : "초안 생성"}
        </button>
      </form>
    </AdminCard>
  );
}

// ── 마크다운 → 붙여넣기용 일반 텍스트 (네이버 블로그용) ────────────
function toPlainText(body: string): string {
  return body
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "· ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .trim();
}

// ── 초안 편집기 ───────────────────────────────────────────────────
export function BlogDraftEditor({
  draft,
}: {
  draft: { id: string; title: string; body: string; topic: string; model: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(draft.title);
  const [body, setBody] = useState(draft.body);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copyMode, setCopyMode] = useState<"plain" | "markdown">("plain");

  const dirty = title !== draft.title || body !== draft.body;

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
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

  async function regenerate() {
    if (regenerating || !confirm("현재 본문을 버리고 같은 주제로 다시 생성할까요?")) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/admin/blog/${draft.id}?action=regenerate`, { method: "POST" });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b?.error ?? "재생성에 실패했습니다.");
      setTitle(b.draft.title);
      setBody(b.draft.body);
      toast("다시 생성했어요", "success");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "재생성에 실패했습니다.", "error");
    } finally {
      setRegenerating(false);
    }
  }

  async function remove() {
    if (!confirm("이 초안을 삭제할까요?")) return;
    const res = await fetch(`/api/admin/blog/${draft.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("삭제했어요", "success");
      router.push("/admin/blog");
    } else {
      toast("삭제에 실패했습니다.", "error");
    }
  }

  async function copyOut() {
    const text =
      (title ? `${title}\n\n` : "") + (copyMode === "plain" ? toPlainText(body) : body.trim());
    try {
      await navigator.clipboard.writeText(text);
      toast(copyMode === "plain" ? "일반 텍스트로 복사했어요" : "마크다운으로 복사했어요", "success");
    } catch {
      toast("복사에 실패했어요. 직접 선택해서 복사해 주세요.", "error");
    }
  }

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
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex rounded-full bg-admin-content p-1 text-xs">
            {(["plain", "markdown"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setCopyMode(m)}
                className={`rounded-full px-3 py-1 font-medium transition-colors ${
                  copyMode === m
                    ? "bg-admin-surface text-admin-text shadow-sm"
                    : "text-admin-muted hover:text-admin-text"
                }`}
              >
                {m === "plain" ? "일반 텍스트(네이버)" : "마크다운(티스토리)"}
              </button>
            ))}
          </div>
          <button
            onClick={copyOut}
            className="rounded-lg border border-admin-border px-3.5 py-2 text-sm font-medium text-admin-text transition-colors hover:border-admin-blue hover:text-admin-blue"
          >
            복사
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-admin-muted">제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
          className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-surface px-3.5 py-2.5 text-sm font-medium text-admin-text outline-none focus:border-admin-blue"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-admin-muted">
          본문 <span className="text-admin-muted/70">(&quot;## 소제목&quot;, &quot;- 목록&quot; 마크다운)</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={24}
          className="mt-1.5 w-full resize-y rounded-lg border border-admin-border bg-admin-surface px-3.5 py-3 font-mono text-[13px] leading-relaxed text-admin-text outline-none focus:border-admin-blue"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-admin-border pt-4">
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="rounded-lg border border-admin-border px-3.5 py-2 text-sm font-medium text-admin-text transition-colors hover:border-admin-blue hover:text-admin-blue disabled:opacity-40"
        >
          {regenerating ? "다시 생성 중…" : "다시 생성"}
        </button>
        <button
          onClick={remove}
          className="rounded-lg border border-admin-border px-3.5 py-2 text-sm font-medium text-admin-red transition-colors hover:border-admin-red"
        >
          삭제
        </button>
        <span className="ml-auto text-[11px] text-admin-muted">
          주제: {draft.topic}
          {draft.model ? ` · ${draft.model}` : ""}
        </span>
      </div>
    </div>
  );
}
