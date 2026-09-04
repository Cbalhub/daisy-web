"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { BLOG_PLATFORM_OPTIONS } from "@/lib/admin/blog-labels";
import { BLOG_TONES } from "@/lib/validation/blog";
import { analyzeSeo } from "@/lib/blog-seo";
import { toPlainText } from "@/lib/blog-format";
import type { BlogPlatform, PublishState } from "@prisma/client";

const TONE_LABEL: Record<string, string> = {
  뼈때리기: "뼈때리기",
  "실무 가이드": "실무 가이드",
  경험담: "경험담",
};

// ── 새 초안 생성 폼 ───────────────────────────────────────────────
export function AddBlogDraft() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [platform, setPlatform] = useState<BlogPlatform>("NAVER");
  const [tone, setTone] = useState<string>("뼈때리기");

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
            <label className="text-xs font-medium text-admin-muted">관점</label>
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


// ── 초안 편집기 ───────────────────────────────────────────────────
export function BlogDraftEditor({
  draft,
}: {
  draft: {
    id: string;
    title: string;
    body: string;
    metaDescription: string;
    tags: string[];
    keywords: string[];
    topic: string;
    model: string;
    platform: BlogPlatform;
    naverState: PublishState;
    naverUrl: string;
    naverError: string;
    tistoryState: PublishState;
    tistoryUrl: string;
    tistoryError: string;
  };
}) {
  const isNaver = draft.platform === "NAVER";
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState(draft.title);
  const [body, setBody] = useState(draft.body);
  const [metaDescription, setMetaDescription] = useState(draft.metaDescription);
  const [tagsText, setTagsText] = useState(draft.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copyMode, setCopyMode] = useState<"plain" | "markdown">(
    draft.platform === "TISTORY" ? "markdown" : "plain"
  );
  // 본문 복사할 때 맨 끝에 붙는 한 줄 CTA(홍보 문구+링크). AI 본문은 홍보를 안 넣게
  // 해서, 홍보는 여기서 딱 한 줄만 통제합니다. 클라이언트 전용(저장 안 함).
  const [ctaOn, setCtaOn] = useState(true);
  const [cta, setCta] = useState("챗봇·업무 자동화·관리자 도구 개발 문의는 movd.co.kr");

  const tags = tagsText
    .split(/[,\n]/)
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);
  const dirty =
    title !== draft.title ||
    body !== draft.body ||
    metaDescription !== draft.metaDescription ||
    tagsText !== draft.tags.join(", ");

  const seo = analyzeSeo({ title, body, metaDescription, tags, keywords: draft.keywords });

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, metaDescription, tags }),
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
      setMetaDescription(b.draft.metaDescription ?? "");
      setTagsText((b.draft.tags ?? []).join(", "));
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

  async function publish(platform: "NAVER" | "TISTORY", action: "queue" | "unqueue" | "reset") {
    if (dirty) {
      toast("먼저 저장하고 발행하세요.", "error");
      return;
    }
    const res = await fetch(`/api/admin/blog/${draft.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, action }),
    });
    const b = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(b?.error ?? "실패했습니다.", "error");
      return;
    }
    toast(
      action === "queue" ? "발행 대기열에 올렸어요" : action === "unqueue" ? "대기열에서 뺐어요" : "초기화했어요",
      "success"
    );
    router.refresh();
  }

  async function copyOut(what: "post" | "tags") {
    let text: string;
    if (what === "tags") {
      text = tags.join(", ");
    } else {
      const main = copyMode === "plain" ? toPlainText(body) : body.trim();
      const tail = ctaOn && cta.trim() ? `\n\n${cta.trim()}` : "";
      text = (title ? `${title}\n\n` : "") + main + tail;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast(what === "tags" ? "태그를 복사했어요" : "본문을 복사했어요", "success");
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
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
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
            onClick={() => copyOut("post")}
            className="rounded-lg border border-admin-border px-3.5 py-2 text-sm font-medium text-admin-text transition-colors hover:border-admin-blue hover:text-admin-blue"
          >
            본문 복사
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-admin-muted">
            메타 설명{" "}
            <span className="text-admin-muted/70">
              {isNaver ? "(네이버는 칸이 없음 — 본문 첫 문단에 반영됨)" : "(티스토리 '설명' 칸에 붙여넣기 · 70~110자)"}
            </span>
          </label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={2}
            maxLength={200}
            className="mt-1.5 w-full resize-y rounded-lg border border-admin-border bg-admin-surface px-3.5 py-2.5 text-sm text-admin-text outline-none focus:border-admin-blue"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-admin-muted">
              태그 <span className="text-admin-muted/70">(쉼표 구분)</span>
            </label>
            {tags.length > 0 && (
              <button
                type="button"
                onClick={() => copyOut("tags")}
                className="text-xs font-medium text-admin-blue hover:underline"
              >
                태그 복사
              </button>
            )}
          </div>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-surface px-3.5 py-2.5 text-sm text-admin-text outline-none focus:border-admin-blue"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-admin-muted">
          <input type="checkbox" checked={ctaOn} onChange={(e) => setCtaOn(e.target.checked)} />
          본문 복사 시 맨 끝에 홍보 한 줄 붙이기
          <span className="text-admin-muted/70">(AI 본문엔 홍보 없음 — 여기서만 통제)</span>
        </label>
        <input
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          disabled={!ctaOn}
          className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-surface px-3.5 py-2.5 text-sm text-admin-text outline-none focus:border-admin-blue disabled:opacity-40"
        />
        {isNaver && (
          <p className="mt-1 text-[11px] text-admin-muted">
            네이버는 본문 링크가 1개 넘으면 저품질 위험 — 이 한 줄만. 링크는 프로필 대표링크에도 걸어두세요.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-admin-border bg-admin-surface p-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-bold tabular-nums ${
              seo.score >= 80
                ? "bg-admin-green-soft text-admin-green"
                : seo.score >= 55
                  ? "bg-admin-amber-soft text-admin-amber"
                  : "bg-admin-red-soft text-admin-red"
            }`}
          >
            {seo.score}
          </span>
          <div>
            <p className="text-sm font-semibold text-admin-text">SEO 점검</p>
            <p className="text-[11px] text-admin-muted">
              검색엔진 실제 점수가 아니라, 빠지기 쉬운 항목 체크입니다. 저장하면 갱신돼요.
            </p>
          </div>
        </div>
        <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {seo.checks.map((c) => (
            <li key={c.label} className="flex items-start gap-2 text-xs">
              <span
                className={
                  c.status === "ok"
                    ? "text-admin-green"
                    : c.status === "warn"
                      ? "text-admin-amber"
                      : "text-admin-red"
                }
              >
                {c.status === "ok" ? "✓" : c.status === "warn" ? "!" : "✕"}
              </span>
              <span className="min-w-0">
                <span className="font-medium text-admin-text">{c.label}</span>{" "}
                <span className="text-admin-muted">— {c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="text-xs font-medium text-admin-muted">
          본문{" "}
          <span className="text-admin-muted/70">
            {isNaver ? "(소제목은 \"■ \" 한 줄. 마크다운 기호 없음)" : "(\"## 소제목\", \"- 목록\" 마크다운)"}
          </span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={24}
          className="mt-1.5 w-full resize-y rounded-lg border border-admin-border bg-admin-surface px-3.5 py-3 font-mono text-[13px] leading-relaxed text-admin-text outline-none focus:border-admin-blue"
        />
      </div>

      <div className="rounded-lg border border-admin-border bg-admin-content px-4 py-3 text-xs leading-relaxed text-admin-muted">
        {isNaver ? (
          <>
            <b className="text-admin-text">네이버 블로그 발행</b> — 제목·본문 붙여넣기 → 소제목은 에디터에서
            굵게/색으로 강조 → <b className="text-admin-text">태그</b> 칸에 태그 붙여넣기 →
            발행창에서 <b className="text-admin-text">&ldquo;검색 허용&rdquo; 체크 필수</b>. (메타 설명 칸은 없음)
          </>
        ) : (
          <>
            <b className="text-admin-text">티스토리 발행</b> — 본문(마크다운) 붙여넣기 →
            우측 설정에서 <b className="text-admin-text">&ldquo;설명&rdquo;</b> 칸에 메타 설명,
            <b className="text-admin-text"> 태그</b> 칸에 태그 붙여넣기.
          </>
        )}
      </div>

      <div className="grid gap-3 border-t border-admin-border pt-4 sm:grid-cols-2">
        <PublishCard
          label="네이버 블로그"
          state={draft.naverState}
          url={draft.naverUrl}
          error={draft.naverError}
          onQueue={() => publish("NAVER", "queue")}
          onUnqueue={() => publish("NAVER", "unqueue")}
          onReset={() => publish("NAVER", "reset")}
        />
        <PublishCard
          label="티스토리"
          state={draft.tistoryState}
          url={draft.tistoryUrl}
          error={draft.tistoryError}
          onQueue={() => publish("TISTORY", "queue")}
          onUnqueue={() => publish("TISTORY", "unqueue")}
          onReset={() => publish("TISTORY", "reset")}
        />
      </div>
      <p className="text-[11px] text-admin-muted">
        &ldquo;발행&rdquo;은 대기열에 올리는 것 — 실제 게시는 PC 의 로컬 퍼블리셔가 실행될 때
        이뤄집니다(tools/blog-publisher). 자동화라 네이버 저품질/차단 위험이 있어요.
      </p>

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

const PUBLISH_LABEL: Record<PublishState, { text: string; cls: string }> = {
  IDLE: { text: "발행 안 함", cls: "bg-admin-bg-soft text-admin-muted" },
  QUEUED: { text: "대기열", cls: "bg-admin-amber-soft text-admin-amber" },
  PUBLISHING: { text: "발행 중…", cls: "bg-admin-blue-soft text-admin-blue" },
  PUBLISHED: { text: "발행됨", cls: "bg-admin-green-soft text-admin-green" },
  FAILED: { text: "실패", cls: "bg-admin-red-soft text-admin-red" },
};

function PublishCard({
  label,
  state,
  url,
  error,
  onQueue,
  onUnqueue,
  onReset,
}: {
  label: string;
  state: PublishState;
  url: string;
  error: string;
  onQueue: () => void;
  onUnqueue: () => void;
  onReset: () => void;
}) {
  const s = PUBLISH_LABEL[state];
  return (
    <div className="rounded-lg border border-admin-border bg-admin-surface p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-admin-text">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>{s.text}</span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {(state === "IDLE" || state === "FAILED") && (
          <button
            onClick={onQueue}
            className="rounded-lg bg-admin-blue px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            {state === "FAILED" ? "다시 발행" : "발행"}
          </button>
        )}
        {state === "QUEUED" && (
          <button
            onClick={onUnqueue}
            className="rounded-lg border border-admin-border px-3 py-1.5 text-xs font-medium text-admin-text hover:border-admin-blue"
          >
            대기열에서 빼기
          </button>
        )}
        {state === "FAILED" && (
          <button
            onClick={onReset}
            className="text-xs text-admin-muted hover:text-admin-text"
          >
            상태 초기화
          </button>
        )}
        {state === "PUBLISHED" && url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-admin-blue hover:underline"
          >
            게시글 열기 →
          </a>
        )}
      </div>
      {state === "FAILED" && error && (
        <p className="mt-2 line-clamp-3 text-[11px] text-admin-red">{error}</p>
      )}
    </div>
  );
}
