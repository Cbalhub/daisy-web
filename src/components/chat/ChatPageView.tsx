"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IconPaymentCard } from "@/components/ui/icons";
import { Mark } from "@/components/brand/Mark";

type OrderSummary = {
  id: string;
  orderToken: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  progressStage: string;
};

type Message = {
  id: string;
  sender: "VISITOR" | "ADMIN";
  type: "TEXT" | "PAYMENT_REQUEST" | "PROGRESS_UPDATE" | "ATTACHMENT";
  body: string;
  createdAt: string;
  order?: OrderSummary | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMime?: string | null;
  read: boolean;
};

function formatMessageTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" }).format(
    new Date(iso)
  );
}

type ConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
};

const ORIGINAL_TITLE = "채팅 | MOVD";

const ORDER_STATUS_TEXT: Record<string, string> = {
  DRAFT: "결제 대기",
  PENDING: "결제 대기",
  PAYMENT_CLAIMED: "입금 확인 중",
  PAID: "결제 완료",
  PARTIAL: "부분 취소됨",
  EXPIRED: "만료됨",
  CANCELLED: "취소됨",
  REFUNDED: "환불됨",
};

const ORDER_STATUS_TONE: Record<string, "accent" | "success" | "neutral"> = {
  DRAFT: "accent",
  PENDING: "accent",
  PAYMENT_CLAIMED: "accent",
  PAID: "success",
};

const STATUS_TONE_CLASS: Record<"accent" | "success" | "neutral", string> = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  neutral: "bg-paper-dim text-muted",
};

const PROJECT_STAGE_TEXT: Record<string, string> = {
  RECEIVED: "작업 시작",
  IN_PROGRESS: "작업 중",
  DELIVERED: "작업물 전달완료",
};

// 새로 받은 메시지를 id 기준으로 합칩니다. 같은 id가 이미 있으면 새 데이터로
// 교체합니다 — 결제 카드처럼 메시지에 연결된 주문 상태가 나중에 바뀌는 경우,
// 서버가 같은 메시지를 최신 order 정보와 함께 다시 보내기 때문입니다.
function mergeMessages(prev: Message[], incoming: Message[]): Message[] {
  if (incoming.length === 0) return prev;
  const byId = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function ChatPageView({
  initialConversations,
  initialConversationId,
}: {
  initialConversations: ConversationSummary[];
  initialConversationId: string;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(initialConversationId);
  const [renderedId, setRenderedId] = useState(initialConversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachError, setAttachError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  // null이 아니면 "새 프로젝트 대화 시작"으로 이름만 정해둔 상태 — 첫 메시지를
  // 실제로 보내기 전까지는 서버에 대화를 만들지 않습니다. 즉시 생성하면
  // 이름만 짓고 아무 말도 안 한 빈 대화가 목록에 계속 쌓이기 때문입니다.
  const [draftTitle, setDraftTitle] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // 사용자가 과거 대화를 읽으려고 위로 스크롤해 둔 상태라면, 새 메시지가
  // 도착해도 바닥으로 끌어내리지 않습니다 — 바닥 근처에 있을 때만 자동 스크롤합니다.
  const nearBottomRef = useRef(true);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // 대화가 바뀌면 이전 대화의 메시지를 즉시 비웁니다 — 이펙트 안에서 하면 한 프레임
  // 늦게 지워져 이전 대화 내용이 잠깐 보이므로, 렌더링 중에 바로 반영합니다.
  // (React 공식 패턴: https://react.dev/learn/you-might-not-need-an-effect)
  if (activeId !== renderedId) {
    setRenderedId(activeId);
    setMessages([]);
    setLoaded(false);
  }

  // 대화를 전환할 때마다 새로 연결합니다 — 폴링 대신 서버가 새 메시지를 즉시
  // 밀어주는 실시간 스트림(SSE)이라, 다른 대화의 메시지가 섞여 들어오지 않도록
  // conversationId를 쿼리로 넘겨 그 대화만 구독합니다.
  useEffect(() => {
    nearBottomRef.current = true;
    const source = new EventSource(`/api/chat/stream?conversationId=${activeId}`);

    source.addEventListener("messages", (event) => {
      const incoming = JSON.parse((event as MessageEvent).data) as Message[];
      setLoaded(true);
      setMessages((prev) => mergeMessages(prev, incoming));

      const hasNewAdminReply = incoming.some((m) => m.sender === "ADMIN");
      if (hasNewAdminReply && document.hidden) {
        document.title = "💬 새 메시지 | MOVD";
      }
    });

    return () => source.close();
  }, [activeId]);

  useEffect(() => {
    function onVisibilityChange() {
      if (!document.hidden) document.title = ORIGINAL_TITLE;
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkOnline() {
      try {
        const res = await fetch("/api/chat/online");
        const data = await res.json();
        if (!cancelled) setAdminOnline(Boolean(data.online));
      } catch {
        // 무시 — 다음 주기에 다시 시도
      }
    }
    checkOnline();
    const interval = setInterval(checkOnline, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!nearBottomRef.current) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function switchConversation(id: string) {
    setDraftTitle(null);
    if (id === activeId) return;
    setActiveId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
  }

  function startDraftConversation(title: string) {
    setDraftTitle(title.trim() || "일반 문의");
  }

  // 초안 상태였다면 실제 대화를 서버에 만들고 목록에 반영합니다. 이미 만들어진
  // 대화라면 아무 것도 하지 않고 그 id를 그대로 돌려줍니다.
  async function resolveActiveConversation(): Promise<string> {
    if (draftTitle === null) return activeId;

    const res = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draftTitle }),
    });
    if (!res.ok) throw new Error("대화 생성에 실패했습니다.");
    const { conversation } = await res.json();

    setConversations((prev) => [
      {
        id: conversation.id,
        title: conversation.title || "일반 문의",
        lastMessageAt: conversation.createdAt,
        lastMessagePreview: null,
        unreadCount: 0,
      },
      ...prev,
    ]);
    setActiveId(conversation.id);
    setDraftTitle(null);
    return conversation.id;
  }

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setDraft("");
    nearBottomRef.current = true; // 직접 보낸 메시지는 항상 바닥으로 스크롤
    try {
      const conversationId = await resolveActiveConversation();
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, body }),
      });
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => mergeMessages(prev, [message]));
      }
    } catch {
      setDraft(body); // 대화 생성 실패 시 입력한 내용을 복원
    } finally {
      setSending(false);
    }
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAttachError("");
    setUploading(true);
    nearBottomRef.current = true; // 직접 보낸 첨부파일은 항상 바닥으로 스크롤
    try {
      const conversationId = await resolveActiveConversation();

      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/chat/upload", { method: "POST", body: form });
      const uploaded = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) throw new Error(uploaded?.error ?? "파일 업로드에 실패했습니다.");

      const res = await fetch("/api/chat/attachment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, url: uploaded.url, name: uploaded.name, mime: uploaded.mime }),
      });
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "첨부 전송에 실패했습니다.");
      }
      const { message } = await res.json();
      setMessages((prev) => mergeMessages(prev, [message]));
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : "파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  if (needsLogin) {
    return (
      <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-muted">로그인 세션이 만료되었어요.</p>
        <Link
          href="/account/login?next=/chat"
          className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper"
        >
          다시 로그인하기
        </Link>
      </div>
    );
  }

  const isDraft = draftTitle !== null;
  const visibleMessages = isDraft ? [] : messages;
  const visibleLoaded = isDraft ? true : loaded;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col px-4">
      <ConversationTabs
        conversations={conversations}
        activeId={activeId}
        draftTitle={draftTitle}
        adminOnline={adminOnline}
        onSelect={switchConversation}
        onStartDraft={startDraftConversation}
      />

      <div ref={listRef} onScroll={handleScroll} className="flex-1 space-y-4 overflow-y-auto py-6">
        <AnimatePresence mode="wait">
          {!visibleLoaded ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-3 pt-4"
            >
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className={cn("h-10 w-2/5 animate-pulse rounded-2xl bg-paper-dim", i === 1 && "ml-auto")}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={isDraft ? "draft" : activeId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {visibleMessages.length === 0 && (
                <div className="mt-10 text-center">
                  <Mark variant="mono" className="mx-auto h-14 w-14 text-accent/70" />
                  <p className="mt-4 text-sm text-muted">
                    {isDraft
                      ? `"${draftTitle}" 프로젝트에 대해 궁금한 점을 남겨주세요.`
                      : "궁금한 점을 편하게 남겨주세요. 담당자가 곧 답변드려요."}
                  </p>
                </div>
              )}
              {visibleMessages.map((m, i) =>
                m.type === "PAYMENT_REQUEST" && m.order ? (
                  <MessageRow key={m.id} align="start" delay={i}>
                    <PaymentRequestCard order={m.order} />
                  </MessageRow>
                ) : m.type === "PROGRESS_UPDATE" && m.order ? (
                  <MessageRow key={m.id} align="start" delay={i}>
                    <ProgressUpdateCard order={m.order} note={m.body} />
                  </MessageRow>
                ) : m.type === "ATTACHMENT" && m.attachmentUrl ? (
                  <MessageRow key={m.id} align={m.sender === "VISITOR" ? "end" : "start"} delay={i}>
                    <div
                      className={cn(
                        "flex flex-col gap-1",
                        m.sender === "VISITOR" ? "items-end" : "items-start"
                      )}
                    >
                      <AttachmentBubble
                        url={m.attachmentUrl}
                        name={m.attachmentName ?? "파일"}
                        mime={m.attachmentMime ?? ""}
                        mine={m.sender === "VISITOR"}
                      />
                      <MessageMeta message={m} />
                    </div>
                  </MessageRow>
                ) : (
                  <MessageRow key={m.id} align={m.sender === "VISITOR" ? "end" : "start"} delay={i}>
                    <div
                      className={cn(
                        "flex max-w-[75%] flex-col gap-1",
                        m.sender === "VISITOR" ? "items-end" : "items-start"
                      )}
                    >
                      <p
                        className={cn(
                          "whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          m.sender === "VISITOR" ? "bg-ink text-paper" : "bg-paper-dim text-ink"
                        )}
                      >
                        {m.body}
                      </p>
                      <MessageMeta message={m} />
                    </div>
                  </MessageRow>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {attachError && (
        <p className="shrink-0 pb-2 text-xs text-accent">{attachError}</p>
      )}
      {visibleMessages.filter((m) => m.sender === "VISITOR").length === 0 && (
        <QuickInfoBar draft={draft} setDraft={setDraft} />
      )}
      <div className="flex shrink-0 items-center gap-2 border-t border-line py-4">
        <label
          className={cn(
            "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink focus-within:ring-2 focus-within:ring-accent",
            uploading && "pointer-events-none opacity-40"
          )}
          aria-label="파일 첨부"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path
              d="M13.5 6.5l-6 6a2.1 2.1 0 0 0 3 3l6.2-6.2a3.5 3.5 0 0 0-5-5L5.3 10.7a4.9 4.9 0 0 0 7 7"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* display:none이면 키보드 tab 순서에서 완전히 빠져서 파일 첨부를
              키보드로는 아예 열 수 없었습니다 — sr-only로 시각적으로만 숨기고
              tab/Enter로는 여전히 접근 가능하게 둡니다. */}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/zip,application/x-zip-compressed"
            className="sr-only"
            disabled={uploading}
            onChange={onFileSelected}
          />
        </label>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="메시지 입력..."
          className="flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={send}
          disabled={!draft.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper disabled:opacity-40"
          aria-label="보내기"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 10h13M10 4l7 6-7 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

// 새 대화를 시작할 때(아직 내가 보낸 메시지가 없을 때) 입력창 위에 뜨는 빠른 정보
// 칩. 예산·희망 일정을 고르면 입력창에 "[예산: …]" 한 줄이 채워집니다 — 담당자가
// 첫 응대 전에 프로젝트 규모를 가늠할 수 있게. 순수 클라이언트(서버 저장 없음).
const BUDGET_OPTIONS = ["100만 이하", "100–300만", "300–700만", "700–1500만", "1500만 이상", "미정"];
const TIMELINE_OPTIONS = ["2주 내", "1개월", "2–3개월", "미정"];

function QuickInfoBar({
  draft,
  setDraft,
}: {
  draft: string;
  setDraft: (v: string) => void;
}) {
  function applyTag(prefix: string, value: string) {
    const line = `[${prefix}: ${value}]`;
    // 같은 접두사의 기존 줄이 있으면 교체, 없으면 맨 앞에 추가.
    const pattern = new RegExp(`^\\[${prefix}: .*\\]\\n?`, "m");
    const next = pattern.test(draft)
      ? draft.replace(pattern, `${line}\n`)
      : `${line}\n${draft}`;
    setDraft(next);
  }

  return (
    <div className="shrink-0 space-y-2 pb-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-muted">예산</span>
        {BUDGET_OPTIONS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => applyTag("예산", v)}
            className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-muted">일정</span>
        {TIMELINE_OPTIONS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => applyTag("일정", v)}
            className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageMeta({ message }: { message: Message }) {
  const mine = message.sender === "VISITOR";
  return (
    <span className="flex items-center gap-1 px-1 text-[11px] text-muted">
      {mine && message.read && <span className="text-accent">읽음</span>}
      {formatMessageTime(message.createdAt)}
    </span>
  );
}

function MessageRow({
  align,
  delay,
  children,
}: {
  align: "start" | "end";
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35, delay: Math.min(delay, 8) * 0.02 }}
      className={cn("flex", align === "end" ? "justify-end" : "justify-start")}
    >
      {children}
    </motion.div>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function ConversationTabs({
  conversations,
  activeId,
  draftTitle,
  adminOnline,
  onSelect,
  onStartDraft,
}: {
  conversations: ConversationSummary[];
  activeId: string;
  draftTitle: string | null;
  adminOnline: boolean;
  onSelect: (id: string) => void;
  onStartDraft: (title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const headerTitle = draftTitle ?? active?.title ?? "대화";
  const totalUnread = draftTitle === null ? conversations.reduce((sum, c) => sum + c.unreadCount, 0) : 0;

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNewForm(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0 border-b border-line pt-4">
      <div className="flex items-center gap-1.5">
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", adminOnline ? "bg-success" : "bg-line")}
        />
        <span className="text-xs text-muted">
          {adminOnline ? "상담원 온라인" : "상담원 오프라인 · 곧 답변드려요"}
        </span>
      </div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 pt-1.5 pb-3 text-left"
      >
        <span className="truncate text-sm font-semibold text-ink">{headerTitle}</span>
        {draftTitle !== null && (
          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
            새 대화
          </span>
        )}
        {totalUnread > 0 && !open && (
          <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-on-accent">
            {totalUnread}
          </span>
        )}
        <svg
          width="11"
          height="11"
          viewBox="0 0 10 10"
          className={cn("ml-auto shrink-0 text-muted transition-transform duration-200", open && "rotate-180")}
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            style={{ transformOrigin: "top" }}
            className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-paper shadow-[var(--shadow-e2)]"
          >
            <p className="px-4 pt-3 text-[11px] text-muted">
              내 대화 {conversations.length}개
            </p>
            <ul className="max-h-72 overflow-y-auto py-1">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      onSelect(c.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-paper-dim",
                      c.id === activeId && draftTitle === null && "bg-paper-dim"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{c.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {c.lastMessagePreview ?? "메시지 없음"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[11px] text-muted">{timeAgo(c.lastMessageAt)}</span>
                      {c.unreadCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-on-accent">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <div className="border-t border-line p-2">
              {!showNewForm ? (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="flex w-full items-center gap-2 rounded-2xl px-2.5 py-2.5 text-left text-sm font-medium text-accent transition-colors hover:bg-paper-dim"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-accent">
                    +
                  </span>
                  새 프로젝트 대화 시작
                </button>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newTitle.trim()) return;
                    onStartDraft(newTitle);
                    setNewTitle("");
                    setShowNewForm(false);
                    setOpen(false);
                  }}
                  className="flex items-center gap-1 rounded-2xl bg-paper-dim p-1 pl-3"
                >
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setShowNewForm(false);
                    }}
                    placeholder="새 프로젝트 이름 (예: 쇼핑몰 챗봇)"
                    className="flex-1 bg-transparent py-1.5 text-xs text-ink outline-none placeholder:text-muted"
                  />
                  <button
                    type="submit"
                    disabled={!newTitle.trim()}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-opacity disabled:opacity-30"
                    aria-label="대화 시작"
                  >
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M3 10h13M10 4l7 6-7 6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaymentRequestCard({ order }: { order: OrderSummary }) {
  const payable = order.status === "DRAFT" || order.status === "PENDING";
  const tone = ORDER_STATUS_TONE[order.status] ?? "neutral";
  return (
    <div className="relative w-72 max-w-full overflow-hidden rounded-xl border border-line bg-paper-dim shadow-[var(--shadow-e1)]">
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
            <IconPaymentCard className="h-3.5 w-3.5" />
            결제 요청
          </span>
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", STATUS_TONE_CLASS[tone])}>
            {ORDER_STATUS_TEXT[order.status] ?? order.status}
          </span>
        </div>
        <p className="mt-3 truncate text-sm font-medium text-ink">{order.title}</p>
        <p className="mt-1 font-display text-[28px] font-semibold tracking-tight tabular-nums text-ink">
          ₩{order.amount.toLocaleString("ko-KR")}
        </p>
      </div>

      {payable && (
        <>
          {/* 영수증/티켓처럼 뜯어내는 느낌의 절취선 — 양 끝에 반원을 오려낸 모양 */}
          <div className="relative h-0">
            <div className="absolute top-0 right-3 left-3 border-t border-dashed border-ink/15" />
            <span className="absolute top-0 -left-2.5 h-5 w-5 -translate-y-1/2 rounded-full bg-paper" />
            <span className="absolute top-0 -right-2.5 h-5 w-5 -translate-y-1/2 rounded-full bg-paper" />
          </div>
          <div className="p-3 pt-4">
            <Link
              href={`/pay/${order.orderToken}`}
              className="block rounded-[10px] bg-accent py-3 text-center text-sm font-semibold text-on-accent transition-[transform,background-color] ease-out hover:bg-accent/90 active:scale-[0.98] active:duration-100"
            >
              결제하기
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function AttachmentBubble({
  url,
  name,
  mime,
  mine,
}: {
  url: string;
  name: string;
  mime: string;
  mine: boolean;
}) {
  if (mime.startsWith("image/")) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block max-w-[70%]">
        <div className="relative aspect-square w-56 max-w-full overflow-hidden rounded-2xl border border-line">
          <Image src={url} alt={name} fill sizes="224px" className="object-cover" />
        </div>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex max-w-[75%] items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm",
        mine ? "border-ink/10 bg-ink text-paper" : "border-line bg-paper-dim text-ink"
      )}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0">
        <path
          d="M6 2.5h6l4 4V16a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 16V4A1.5 1.5 0 0 1 5.5 2.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M12 2.5V7h4.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <span className="truncate">{name}</span>
    </a>
  );
}

function ProgressUpdateCard({ order, note }: { order: OrderSummary; note: string }) {
  const stageText = PROJECT_STAGE_TEXT[order.progressStage] ?? order.progressStage;
  return (
    <div className="w-72 max-w-full rounded-xl border border-line bg-paper-dim px-5 py-4 shadow-[var(--shadow-e1)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{order.title}</p>
          <p className="mt-1 text-xs text-muted">진행 상황 업데이트</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
          {stageText}
        </span>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-muted">{note}</p>
    </div>
  );
}
