"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { ORDER_STATUS_LABEL, PROJECT_STAGE_LABEL, PROJECT_STAGE_ORDER } from "@/lib/admin/status";
import type { OrderStatus, ProjectStage } from "@prisma/client";

type OrderSummary = {
  id: string;
  orderToken: string;
  title: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  progressStage: ProjectStage;
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

// 새로 받은 메시지를 id 기준으로 합칩니다. 같은 id가 이미 있으면 새 데이터로 교체합니다 —
// 결제 카드처럼 메시지에 연결된 주문 상태가 나중에 바뀌면, 서버가 같은 메시지를
// 최신 order 정보와 함께 다시 보내기 때문입니다.
function mergeMessages(prev: Message[], incoming: Message[]): Message[] {
  if (incoming.length === 0) return prev;
  const byId = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return [...byId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

type PayableOrder = { id: string; title: string; progressStage: ProjectStage };
type QuickReply = { id: string; label: string; body: string };

type SiblingConversation = { id: string; title: string };

export function ChatThread({
  conversationId,
  conversationTitle,
  siblings,
  orders,
  quickReplies,
  initialMessages,
}: {
  conversationId: string;
  conversationTitle?: string;
  siblings?: SiblingConversation[];
  orders: PayableOrder[];
  quickReplies: QuickReply[];
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachError, setAttachError] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // 관리자가 과거 대화를 읽으려고 위로 스크롤해 둔 상태라면, 새 메시지가
  // 도착해도 바닥으로 끌어내리지 않습니다 — 바닥 근처에 있을 때만 자동 스크롤합니다.
  const nearBottomRef = useRef(true);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // 폴링 대신 서버가 새 메시지를 즉시 밀어주는 실시간 스트림(SSE)에 연결합니다.
  useEffect(() => {
    const source = new EventSource(`/api/admin/chats/${conversationId}/stream`);
    source.addEventListener("messages", (event) => {
      const incoming = JSON.parse((event as MessageEvent).data) as Message[];
      setMessages((prev) => mergeMessages(prev, incoming));
      // 새 메시지를 받는 것 자체가 서버에서 이 대화의 안읽음 메시지를
      // 읽음 처리한다는 뜻이라, 사이드바 뱃지·채팅 목록의 안읽음 수도
      // 같이 갱신되도록 현재 라우트 트리를 새로고침합니다.
      router.refresh();
    });
    return () => source.close();
  }, [conversationId, router]);

  // 대화를 열자마자 서버 쪽 초기 로딩에서 이미 읽음 처리가 끝나 있으므로,
  // 첫 SSE 메시지를 기다리지 않고 바로 한 번 새로고침해 뱃지를 즉시 지웁니다.
  useEffect(() => {
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    if (!nearBottomRef.current) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setDraft("");
    nearBottomRef.current = true; // 직접 보낸 메시지는 항상 바닥으로 스크롤
    try {
      const res = await fetch(`/api/admin/chats/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => mergeMessages(prev, [message]));
      }
    } finally {
      setSending(false);
    }
  }

  function onPaymentRequestCreated(message: Message) {
    setMessages((prev) => mergeMessages(prev, [message]));
    setShowPaymentForm(false);
  }

  function onProgressUpdated(message: Message | null) {
    if (message) setMessages((prev) => mergeMessages(prev, [message]));
    setShowProgressForm(false);
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAttachError("");
    setUploading(true);
    nearBottomRef.current = true; // 직접 보낸 첨부파일은 항상 바닥으로 스크롤
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/chat/upload", { method: "POST", body: form });
      const uploaded = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) throw new Error(uploaded?.error ?? "파일 업로드에 실패했습니다.");

      const res = await fetch(`/api/admin/chats/${conversationId}/attachment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: uploaded.url, name: uploaded.name, mime: uploaded.mime }),
      });
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

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* 이 고객이 대화를 2개 이상 갖고 있으면(=프로젝트가 여러 개면) 탭으로
          보여줘서 지금 어느 대화를 보고 있는지, 다른 대화로는 어떻게
          넘어가는지 한눈에 알 수 있게 합니다. */}
      {siblings && siblings.length > 1 && (
        <div className="mb-3 flex items-center gap-1 overflow-x-auto border-b border-admin-border pb-3">
          {siblings.map((s) => (
            <Link
              key={s.id}
              href={`/admin/chats/${s.id}`}
              className="relative shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
            >
              {s.id === conversationId && (
                <motion.span
                  layoutId="active-admin-conversation-tab"
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 rounded-full bg-admin-blue"
                />
              )}
              <span
                className={cn(
                  "relative",
                  s.id === conversationId ? "text-white" : "text-admin-muted hover:text-admin-text"
                )}
              >
                {s.title}
              </span>
            </Link>
          ))}
        </div>
      )}
      {conversationTitle && (!siblings || siblings.length <= 1) && (
        <p className="mb-3 border-b border-admin-border pb-3 text-xs font-medium text-admin-muted">
          {conversationTitle}
        </p>
      )}
      {/* 이 고객이 진행 중인 프로젝트가 2개 이상이면, 대화 하나에 여러 프로젝트
          내용이 섞여도 한눈에 구분할 수 있도록 요약 줄을 보여줍니다. */}
      {orders.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-admin-border pb-3">
          <span className="text-xs text-admin-muted">진행 중인 프로젝트</span>
          {orders.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-admin-border px-2.5 py-1 text-xs text-admin-text"
            >
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[PROJECT_STAGE_LABEL[o.progressStage].tone])} />
              {o.title}
            </span>
          ))}
        </div>
      )}
      <div ref={listRef} onScroll={handleScroll} className="flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {messages.map((m) =>
          m.type === "PAYMENT_REQUEST" && m.order ? (
            <AdminMessageRow key={m.id} align="end">
              <PaymentRequestCard order={m.order} />
            </AdminMessageRow>
          ) : m.type === "PROGRESS_UPDATE" && m.order ? (
            <AdminMessageRow key={m.id} align="end">
              <ProgressUpdateCard order={m.order} note={m.body} />
            </AdminMessageRow>
          ) : m.type === "ATTACHMENT" && m.attachmentUrl ? (
            <AdminMessageRow key={m.id} align={m.sender === "ADMIN" ? "end" : "start"}>
              <div
                className={cn(
                  "flex flex-col gap-1",
                  m.sender === "ADMIN" ? "items-end" : "items-start"
                )}
              >
                <AttachmentBubble
                  url={m.attachmentUrl}
                  name={m.attachmentName ?? "파일"}
                  mime={m.attachmentMime ?? ""}
                  mine={m.sender === "ADMIN"}
                />
                <MessageMeta message={m} />
              </div>
            </AdminMessageRow>
          ) : (
            <AdminMessageRow key={m.id} align={m.sender === "ADMIN" ? "end" : "start"}>
              <div
                className={cn(
                  "flex max-w-[75%] flex-col gap-1",
                  m.sender === "ADMIN" ? "items-end" : "items-start"
                )}
              >
                <p
                  className={cn(
                    "whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.sender === "ADMIN"
                      ? "bg-admin-blue text-white"
                      : "bg-admin-content text-admin-text"
                  )}
                >
                  {m.body}
                </p>
                <MessageMeta message={m} />
              </div>
            </AdminMessageRow>
          )
        )}
      </div>

      {showPaymentForm && (
        <PaymentRequestForm
          conversationId={conversationId}
          onCreated={onPaymentRequestCreated}
          onCancel={() => setShowPaymentForm(false)}
        />
      )}

      {showProgressForm && (
        <ProgressUpdateForm
          conversationId={conversationId}
          orders={orders}
          onUpdated={onProgressUpdated}
          onCancel={() => setShowProgressForm(false)}
        />
      )}

      {attachError && <p className="mt-3 text-xs text-admin-red">{attachError}</p>}
      <div className="mt-3 flex items-center gap-2 border-t border-admin-border pt-3">
        <button
          onClick={() => setShowPaymentForm((v) => !v)}
          className="shrink-0 rounded-full border border-admin-border px-3 py-2.5 text-xs font-medium text-admin-text transition-colors hover:border-admin-blue"
        >
          + 결제 요청
        </button>
        {orders.length > 0 && (
          <button
            onClick={() => setShowProgressForm((v) => !v)}
            className="shrink-0 rounded-full border border-admin-border px-3 py-2.5 text-xs font-medium text-admin-text transition-colors hover:border-admin-blue"
          >
            + 진행 상황
          </button>
        )}
        {quickReplies.length > 0 && (
          <QuickReplyPicker replies={quickReplies} onPick={(body) => setDraft(body)} />
        )}
        <label
          className={cn(
            "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-admin-border text-admin-muted transition-colors hover:border-admin-blue hover:text-admin-text focus-within:ring-2 focus-within:ring-admin-blue",
            uploading && "pointer-events-none opacity-40"
          )}
          aria-label="파일 첨부"
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
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
          placeholder="답장 입력..."
          className="flex-1 rounded-full border border-admin-border bg-admin-content px-4 py-2.5 text-sm outline-none focus:border-admin-blue"
        />
        <button
          onClick={send}
          disabled={!draft.trim() || sending}
          className="shrink-0 rounded-full bg-admin-blue px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
        >
          전송
        </button>
      </div>
    </div>
  );
}

function MessageMeta({ message }: { message: Message }) {
  const mine = message.sender === "ADMIN";
  return (
    <span className="flex items-center gap-1 px-1 text-[11px] text-admin-muted">
      {mine && message.read && <span className="text-admin-blue">읽음</span>}
      {formatMessageTime(message.createdAt)}
    </span>
  );
}

function AdminMessageRow({
  align,
  children,
}: {
  align: "start" | "end";
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      className={cn("flex", align === "end" ? "justify-end" : "justify-start")}
    >
      {children}
    </motion.div>
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
        <div className="relative aspect-square w-52 max-w-full overflow-hidden rounded-2xl border border-admin-border">
          <Image src={url} alt={name} fill sizes="208px" className="object-cover" />
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
        mine ? "border-admin-blue/20 bg-admin-blue text-white" : "border-admin-border bg-admin-content text-admin-text"
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

function PaymentRequestCard({ order }: { order: OrderSummary }) {
  const status = ORDER_STATUS_LABEL[order.status];
  return (
    <div className="w-72 max-w-full overflow-hidden rounded-2xl bg-admin-surface shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)]">
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-admin-muted">결제 요청</span>
          <AdminBadge tone={status.tone} className="px-2 py-0.5 text-[11px]">{status.label}</AdminBadge>
        </div>
        <p className="mt-3 truncate text-sm font-medium text-admin-text">{order.title}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-admin-text">
          ₩{order.amount.toLocaleString("ko-KR")}
        </p>
      </div>
      <Link
        href={`/admin/orders/${order.id}`}
        className="block bg-admin-content py-3 text-center text-xs font-medium text-admin-text transition-colors hover:bg-admin-border"
      >
        주문 상세 보기
      </Link>
    </div>
  );
}

function ProgressUpdateCard({ order, note }: { order: OrderSummary; note: string }) {
  const stage = PROJECT_STAGE_LABEL[order.progressStage];
  return (
    <div className="w-72 max-w-full rounded-2xl bg-admin-surface px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-admin-text">{order.title}</p>
          <p className="mt-1 text-xs text-admin-muted">진행 상황 업데이트</p>
        </div>
        <AdminBadge tone={stage.tone} className="shrink-0 px-2 py-0.5 text-[11px]">
          {stage.label}
        </AdminBadge>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-admin-muted">{note}</p>
    </div>
  );
}

function PaymentRequestForm({
  conversationId,
  onCreated,
  onCancel,
}: {
  conversationId: string;
  onCreated: (message: Message) => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [items, setItems] = useState<{ label: string; amount: string }[]>([]);
  const [loading, setLoading] = useState(false);

  function addItem() {
    setItems((v) => [...v, { label: "", amount: "" }]);
  }
  function updateItem(i: number, patch: Partial<{ label: string; amount: string }>) {
    setItems((v) => v.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }
  function removeItem(i: number) {
    setItems((v) => v.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = Number(amount);
    if (!title.trim() || !amountNum || amountNum <= 0) {
      toast("제목과 금액을 확인해 주세요.", "error");
      return;
    }

    // 항목별 가격은 총액과 별개로, 견적서에 그대로 표시할 값입니다 — 자동으로
    // 나누지 않고 대표님이 입력한 금액을 그대로 씁니다(비워두면 가격 없이 이름만 표시).
    const lineItems = items
      .filter((item) => item.label.trim())
      .map((item) => ({
        label: item.label.trim(),
        amount: item.amount.trim() ? Number(item.amount) : undefined,
      }));

    setLoading(true);
    const res = await fetch(`/api/admin/chats/${conversationId}/payment-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        amount: amountNum,
        businessRegNo: businessRegNo.trim() || undefined,
        lineItems: lineItems.length > 0 ? lineItems : undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? "결제 요청 생성에 실패했습니다.", "error");
      return;
    }

    toast("결제 요청을 보냈어요", "success");
    const { message } = await res.json();
    onCreated(message);
    setTitle("");
    setDescription("");
    setAmount("");
    setBusinessRegNo("");
    setItems([]);
  }

  return (
    <form
      onSubmit={submit}
      className="mb-3 rounded-2xl bg-admin-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)]"
    >
      <p className="text-sm font-semibold text-admin-text">결제 요청 보내기</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-admin-muted">주문 제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 랜딩페이지 제작 착수금"
            className="mt-1.5 w-full rounded-lg bg-admin-content px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-blue"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-admin-muted">금액 (원)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min={1}
            placeholder="3,000,000"
            className="mt-1.5 w-full rounded-lg bg-admin-content px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-admin-blue"
          />
        </div>
      </div>
      <div className="mt-3">
        <label className="text-xs font-medium text-admin-muted">
          상세 기능 / 작업 범위 <span className="font-normal text-admin-muted/70">(선택, 입금 안내 페이지에 표시돼요)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1.5 w-full resize-none rounded-lg bg-admin-content px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-blue"
        />
      </div>
      <div className="mt-3">
        <label className="text-xs font-medium text-admin-muted">
          사업자등록번호 <span className="font-normal text-admin-muted/70">(선택 — 사업자 고객만, 장부에서 개인/사업자 구분에 쓰여요)</span>
        </label>
        <input
          value={businessRegNo}
          onChange={(e) => setBusinessRegNo(e.target.value)}
          placeholder="000-00-00000"
          className="mt-1.5 w-full rounded-lg bg-admin-content px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-blue"
        />
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-admin-muted">
            견적서 품목 <span className="font-normal text-admin-muted/70">(선택, 가격은 비워두면 이름만 표시돼요)</span>
          </label>
          <button
            type="button"
            onClick={addItem}
            className="text-xs font-medium text-admin-blue hover:underline"
          >
            + 항목 추가
          </button>
        </div>
        {items.length > 0 && (
          <div className="mt-2 space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={item.label}
                  onChange={(e) => updateItem(i, { label: e.target.value })}
                  placeholder="기능 이름"
                  className="min-w-0 flex-1 rounded-lg bg-admin-content px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-blue"
                />
                <input
                  value={item.amount}
                  onChange={(e) => updateItem(i, { amount: e.target.value })}
                  type="number"
                  min={0}
                  placeholder="가격(선택)"
                  className="w-28 shrink-0 rounded-lg bg-admin-content px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-admin-blue"
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  aria-label="항목 삭제"
                  className="shrink-0 text-admin-muted hover:text-admin-red"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-admin-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "생성 중..." : "결제 요청 보내기"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm text-admin-muted hover:bg-admin-content">
          취소
        </button>
      </div>
    </form>
  );
}

function ProgressUpdateForm({
  conversationId,
  orders,
  onUpdated,
  onCancel,
}: {
  conversationId: string;
  orders: PayableOrder[];
  onUpdated: (message: Message | null) => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [orderId, setOrderId] = useState(orders[0]?.id ?? "");
  const order = orders.find((o) => o.id === orderId) ?? orders[0];
  const [stage, setStage] = useState<ProjectStage>(order?.progressStage ?? "RECEIVED");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;
    setLoading(true);

    const res = await fetch(`/api/admin/chats/${conversationId}/progress-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, stage, note: note.trim() || undefined }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? "진행 상황 업데이트에 실패했습니다.", "error");
      return;
    }

    toast("진행 상황을 보냈어요", "success");
    const { message } = await res.json();
    onUpdated(message ?? null);
  }

  if (!order) return null;

  return (
    <form
      onSubmit={submit}
      className="mb-3 rounded-2xl bg-admin-surface p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)]"
    >
      <p className="text-sm font-semibold text-admin-text">진행 상황 업데이트</p>
      {orders.length > 1 && (
        <div className="mt-3">
          <label className="text-xs font-medium text-admin-muted">프로젝트</label>
          <div className="mt-1.5">
            <OrderSelect orders={orders} value={order.id} onChange={setOrderId} />
          </div>
        </div>
      )}
      <div className="mt-3">
        <label className="text-xs font-medium text-admin-muted">단계</label>
        <div className="mt-1.5">
          <StageSelect value={stage} onChange={setStage} />
        </div>
      </div>
      <div className="mt-3">
        <label className="text-xs font-medium text-admin-muted">
          메모 <span className="font-normal text-admin-muted/70">(선택, 비우면 기본 문구로 전송돼요)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={`예: "${PROJECT_STAGE_LABEL[stage].label} 단계로 업데이트되었습니다."`}
          className="mt-1.5 w-full resize-none rounded-lg bg-admin-content px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-blue"
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-admin-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "전송 중..." : "진행 상황 보내기"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm text-admin-muted hover:bg-admin-content">
          취소
        </button>
      </div>
    </form>
  );
}

function OrderSelect({
  orders,
  value,
  onChange,
}: {
  orders: PayableOrder[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const current = orders.find((o) => o.id === value) ?? orders[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-left text-xs font-medium text-admin-text"
      >
        <span className="truncate">{current.title}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={cn("ml-auto shrink-0 text-admin-muted transition-transform duration-150", open && "rotate-180")}
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
          <motion.ul
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            style={{ transformOrigin: "top left" }}
            className="absolute left-0 z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-admin-border bg-admin-surface py-1 shadow-lg"
          >
            {orders.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "block w-full truncate px-3 py-2 text-left text-xs transition-colors hover:bg-admin-content",
                    o.id === value ? "font-semibold text-admin-text" : "text-admin-muted"
                  )}
                >
                  {o.title}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickReplyPicker({
  replies,
  onPick,
}: {
  replies: { id: string; label: string; body: string }[];
  onPick: (body: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-admin-border text-admin-muted transition-colors hover:border-admin-blue hover:text-admin-text"
        aria-label="빠른 답변"
      >
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
          <path
            d="M11 2.5L4 11.5H9.5L9 17.5L16 8.5H10.5L11 2.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            style={{ transformOrigin: "bottom left" }}
            className="absolute bottom-full left-0 z-20 mb-1.5 max-h-64 w-64 overflow-y-auto rounded-lg border border-admin-border bg-admin-surface py-1 shadow-lg"
          >
            {replies.map((qr) => (
              <li key={qr.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(qr.body);
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left transition-colors hover:bg-admin-content"
                >
                  <p className="text-xs font-semibold text-admin-text">{qr.label}</p>
                  <p className="mt-0.5 truncate text-xs text-admin-muted">{qr.body}</p>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

const TONE_DOT: Record<string, string> = {
  neutral: "bg-admin-muted",
  blue: "bg-admin-blue",
  green: "bg-admin-green",
  amber: "bg-admin-amber",
  red: "bg-admin-red",
};

function StageSelect({
  value,
  onChange,
}: {
  value: ProjectStage;
  onChange: (stage: ProjectStage) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const current = PROJECT_STAGE_LABEL[value];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-xs font-medium text-admin-text"
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[current.tone])} />
        {current.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={cn("ml-auto shrink-0 text-admin-muted transition-transform duration-150", open && "rotate-180")}
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
          <motion.ul
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            style={{ transformOrigin: "top left" }}
            className="absolute left-0 z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-admin-border bg-admin-surface py-1 shadow-lg"
          >
            {PROJECT_STAGE_ORDER.map((s) => {
              const opt = PROJECT_STAGE_LABEL[s];
              return (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(s);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-admin-content",
                      s === value ? "font-semibold text-admin-text" : "text-admin-muted"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[opt.tone])} />
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
