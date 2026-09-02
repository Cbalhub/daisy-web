"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/brand/Mark";
import { useToast } from "@/components/ui/Toast";
import { INQUIRY_BUDGETS, INQUIRY_TIMELINES } from "@/lib/validation/inquiry";

// 대화가 아직 하나도 없는 고객이 /chat 에 처음 들어오면 뜨는 문의 폼.
// 제출하면 대화가 만들어지고 요약이 첫 메시지로 남습니다(관리자 알림 발송).
// "그냥 채팅으로" 를 누르면 폼 없이 빈 대화로 시작합니다.
export function PreChatForm() {
  const router = useRouter();
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [timeline, setTimeline] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(withForm: boolean) {
    if (busy) return;
    if (withForm && message.trim().length < 5) {
      toast("문의 내용을 조금 더 적어주세요.", "error");
      return;
    }
    setBusy(true);
    try {
      let attach: { url: string; name: string; mime: string } | null = null;
      if (withForm && file) {
        const form = new FormData();
        form.append("file", file);
        const up = await fetch("/api/chat/upload", { method: "POST", body: form });
        const upBody = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(upBody?.error ?? "파일 업로드에 실패했습니다.");
        attach = { url: upBody.url, name: upBody.name, mime: upBody.mime };
      }

      if (withForm) {
        const res = await fetch("/api/chat/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message.trim(),
            budget: budget || undefined,
            preferredTimeline: timeline || undefined,
            attachmentUrl: attach?.url,
            attachmentName: attach?.name,
            attachmentMime: attach?.mime,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? "문의 전송에 실패했습니다.");
      } else {
        const res = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error("대화 시작에 실패했습니다.");
      }
      // /chat 서버 컴포넌트가 대화 목록을 다시 읽고 채팅 화면으로 전환하도록.
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "문제가 발생했어요.", "error");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center px-4 py-10">
      <Mark variant="mono" className="mx-auto h-11 w-11 text-accent/70" />
      <h1 className="mt-4 text-center text-lg font-semibold text-ink">무엇을 만들어 드릴까요?</h1>
      <p className="mt-1.5 text-center text-sm text-muted">
        대략만 적어주셔도 괜찮아요. 담당자가 확인하고 채팅으로 이어서 여쭤봅니다.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-ink-soft">예산 (선택)</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {INQUIRY_BUDGETS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBudget(budget === b ? "" : b)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  budget === b ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-soft">희망 일정 (선택)</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {INQUIRY_TIMELINES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeline(timeline === t ? "" : t)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  timeline === t ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-soft">어떤 걸 만들고 싶으세요?</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="예: 네이버 예약을 카톡으로 자동 안내하는 챗봇이 필요해요. 하루 30건 정도…"
            className="mt-1.5 w-full resize-y rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-ink"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <span className="rounded-md border border-line px-2.5 py-1.5 transition-colors hover:border-ink/40">
            파일 첨부
          </span>
          <span className="truncate">{file ? file.name : "기획서·캡처 등 (선택)"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/zip,application/x-zip-compressed"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <button
          type="button"
          onClick={() => submit(true)}
          disabled={busy}
          className="w-full rounded-full bg-ink py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "보내는 중…" : "문의 보내기"}
        </button>
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={busy}
          className="w-full text-center text-xs text-muted hover:text-ink disabled:opacity-40"
        >
          그냥 채팅으로 시작할게요
        </button>
      </div>
    </div>
  );
}
