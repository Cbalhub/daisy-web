"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { AdminSelect } from "@/components/admin/ui/Select";
import { DatePicker } from "@/components/admin/ui/DatePicker";

const inputCls =
  "w-full rounded-lg border border-admin-border bg-admin-content px-3 py-2 text-sm outline-none focus:border-admin-blue";

export type ConversationOption = { id: string; label: string };

function todayLocal() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function toLocalDate(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60000).toISOString().slice(0, 10);
}

export type LedgerEntryDefaults = {
  id?: string;
  occurredAt?: Date | string | null;
  kind?: "REVENUE" | "REFUND" | "EXPENSE";
  customerName?: string;
  title?: string;
  detail?: string | null;
  amount?: number | null;
  businessRegNo?: string | null;
  phone?: string | null;
  proofType?: string | null;
  expenseCategory?: string | null;
  taxInvoiceIssuedAt?: Date | string | null;
  memo?: string | null;
  conversationId?: string | null;
};

// Add·Edit 가 공유하는 입력 필드 묶음. 폼 태그·제출 로직은 각 래퍼가 담당합니다.
function LedgerFields({
  defaults,
  conversations,
}: {
  defaults: LedgerEntryDefaults;
  conversations: ConversationOption[];
}) {
  const [date, setDate] = useState(
    defaults.occurredAt ? toLocalDate(defaults.occurredAt) : todayLocal()
  );
  const [kind, setKind] = useState<string>(defaults.kind ?? "REVENUE");
  const [taxDate, setTaxDate] = useState(toLocalDate(defaults.taxInvoiceIssuedAt));
  const [conversationId, setConversationId] = useState(defaults.conversationId ?? "");
  const isExpense = kind === "EXPENSE";

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* 서버로 보낼 값들 — 커스텀 컴포넌트는 hidden input 으로 실어 보냅니다. */}
      <input type="hidden" name="occurredAt" value={date} />
      <input type="hidden" name="taxInvoiceIssuedAt" value={taxDate} />
      <input type="hidden" name="conversationId" value={conversationId} />

      <div className="text-xs font-medium text-admin-muted">
        결제일
        <div className="mt-1.5 [&>div>button:first-child]:w-full [&>div>button:first-child]:justify-start [&>div>button:first-child]:bg-admin-content">
          <DatePicker value={date} onChange={setDate} />
        </div>
      </div>
      <div className="text-xs font-medium text-admin-muted">
        구분
        <AdminSelect
          name="kind"
          defaultValue={kind}
          onChange={setKind}
          options={[
            { value: "REVENUE", label: "결제(수입)" },
            { value: "REFUND", label: "환불" },
            { value: "EXPENSE", label: "지출(경비)" },
          ]}
        />
      </div>
      <label className="text-xs font-medium text-admin-muted">
        {isExpense ? "지급처" : "발주처 / 고객명"}
        <input
          name="customerName"
          required
          maxLength={100}
          defaultValue={defaults.customerName ?? ""}
          className={`mt-1.5 ${inputCls}`}
        />
      </label>
      <label className="text-xs font-medium text-admin-muted">
        {isExpense ? "지출 항목명" : "외주 프로젝트명"}
        <input
          name="title"
          required
          maxLength={200}
          defaultValue={defaults.title ?? ""}
          className={`mt-1.5 ${inputCls}`}
        />
      </label>
      {isExpense && (
        <div className="text-xs font-medium text-admin-muted">
          경비 항목
          <AdminSelect
            name="expenseCategory"
            defaultValue={defaults.expenseCategory ?? ""}
            placeholder="선택"
            options={[
              { value: "SERVER", label: "서버·인프라" },
              { value: "DOMAIN", label: "도메인" },
              { value: "SUBCONTRACT", label: "재하청·외주" },
              { value: "TAX", label: "세금·공과금" },
              { value: "SOFTWARE", label: "소프트웨어·툴" },
              { value: "MARKETING", label: "광고·마케팅" },
              { value: "ETC", label: "기타" },
            ]}
          />
        </div>
      )}
      <label className="text-xs font-medium text-admin-muted sm:col-span-2">
        상세 기능
        <input
          name="detail"
          maxLength={1000}
          defaultValue={defaults.detail ?? ""}
          className={`mt-1.5 ${inputCls}`}
        />
      </label>
      <label className="text-xs font-medium text-admin-muted">
        금액 (KRW)
        <input
          name="amount"
          required
          inputMode="numeric"
          placeholder="1000000"
          defaultValue={defaults.amount != null ? String(Math.abs(defaults.amount)) : ""}
          className={`mt-1.5 ${inputCls} tabular-nums`}
        />
      </label>
      <label className="text-xs font-medium text-admin-muted">
        사업자등록번호 <span className="font-normal">(사업자면)</span>
        <input
          name="businessRegNo"
          maxLength={20}
          defaultValue={defaults.businessRegNo ?? ""}
          className={`mt-1.5 ${inputCls} tabular-nums`}
        />
      </label>
      <label className="text-xs font-medium text-admin-muted">
        연락처
        <input
          name="phone"
          maxLength={30}
          defaultValue={defaults.phone ?? ""}
          className={`mt-1.5 ${inputCls} tabular-nums`}
        />
      </label>
      <div className="text-xs font-medium text-admin-muted">
        증빙 수단
        <AdminSelect
          name="proofType"
          defaultValue={defaults.proofType ?? ""}
          placeholder="선택 안 함"
          options={[
            { value: "", label: "선택 안 함" },
            { value: "TAX_INVOICE", label: "세금계산서" },
            { value: "CASH_RECEIPT", label: "현금영수증" },
            { value: "TRANSFER_RECORD", label: "계좌이체 내역" },
            { value: "NONE", label: "없음" },
          ]}
        />
      </div>
      <div className="text-xs font-medium text-admin-muted">
        세금계산서 발행일 <span className="font-normal">(선택)</span>
        <div className="mt-1.5 [&>div>button:first-child]:w-full [&>div>button:first-child]:justify-start [&>div>button:first-child]:bg-admin-content">
          <DatePicker value={taxDate} onChange={setTaxDate} placeholder="미발행" />
        </div>
      </div>
      <label className="text-xs font-medium text-admin-muted sm:col-span-2">
        비고
        <input
          name="memo"
          maxLength={1000}
          defaultValue={defaults.memo ?? ""}
          className={`mt-1.5 ${inputCls}`}
        />
      </label>

      {/* 대화 연결 + 알림 */}
      <div className="text-xs font-medium text-admin-muted sm:col-span-2">
        고객 대화 연결 <span className="font-normal">(선택)</span>
        <div className="mt-1.5">
          <AdminSelect
            name="conversationPick"
            defaultValue={conversationId}
            onChange={setConversationId}
            placeholder="연결 안 함"
            options={[
              { value: "", label: "연결 안 함" },
              ...conversations.map((c) => ({ value: c.id, label: c.label })),
            ]}
          />
        </div>
      </div>
      <label
        className={`flex items-center gap-2 text-xs font-medium sm:col-span-2 ${
          conversationId ? "text-admin-text" : "cursor-not-allowed text-admin-muted opacity-50"
        }`}
      >
        <input
          type="checkbox"
          name="notifyChat"
          disabled={!conversationId}
          defaultChecked={false}
          className="h-4 w-4 rounded border-admin-border"
        />
        연결된 대화로 안내 메시지 보내기 (결제·환불 확인)
      </label>
    </div>
  );
}

function readForm(form: HTMLFormElement) {
  const fd = new FormData(form);
  const amountRaw = String(fd.get("amount") ?? "").replace(/[,\s]/g, "");
  return {
    occurredAt: String(fd.get("occurredAt") ?? ""),
    kind: String(fd.get("kind") ?? "REVENUE"),
    title: String(fd.get("title") ?? "").trim(),
    detail: String(fd.get("detail") ?? "").trim(),
    customerName: String(fd.get("customerName") ?? "").trim(),
    amount: Number(amountRaw),
    businessRegNo: String(fd.get("businessRegNo") ?? "").trim(),
    phone: String(fd.get("phone") ?? "").trim(),
    proofType: String(fd.get("proofType") ?? ""),
    expenseCategory: String(fd.get("expenseCategory") ?? ""),
    taxInvoiceIssuedAt: String(fd.get("taxInvoiceIssuedAt") ?? ""),
    memo: String(fd.get("memo") ?? "").trim(),
    conversationId: String(fd.get("conversationId") ?? ""),
    notifyChat: fd.get("notifyChat") === "on",
  };
}

export function AddLedgerEntry({ conversations = [] }: { conversations?: ConversationOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/ledger/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readForm(e.currentTarget)),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = body?.error ?? "추가에 실패했습니다.";
      setError(message);
      toast(message, "error");
      setLoading(false);
      return;
    }
    toast("장부에 추가했어요", "success");
    router.refresh();
    setOpen(false);
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-admin-border px-3.5 py-2 text-xs font-medium text-admin-text transition-colors hover:border-admin-blue hover:text-admin-blue"
      >
        <span className="text-sm leading-none">+</span> 행 추가
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-xl border border-admin-border bg-admin-surface p-5 shadow-[var(--shadow-e1)]"
    >
      <p className="text-sm font-semibold text-admin-text">장부에 직접 추가</p>
      <p className="mt-0.5 text-xs text-admin-muted">
        사이트 결제 흐름을 거치지 않고 받은 대금(계좌 직접 입금 등)을 적어 넣습니다.
      </p>

      <LedgerFields defaults={{}} conversations={conversations} />

      {error && <p className="mt-3 text-xs text-admin-red">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-admin-blue px-4 py-2 text-xs font-semibold text-admin-bg disabled:opacity-50"
        >
          {loading ? "추가 중..." : "추가"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-xs font-medium text-admin-muted hover:text-admin-text"
        >
          취소
        </button>
      </div>
    </form>
  );
}

// 한 행의 수정·삭제 액션. 수정은 화면 중앙 모달로 엽니다(표가 넓어 인라인이 곤란).
export function ManualEntryActions({
  entry,
  conversations,
}: {
  entry: LedgerEntryDefaults & { id: string };
  conversations: ConversationOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/admin/ledger/entries/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readForm(e.currentTarget)),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = body?.error ?? "저장에 실패했습니다.";
      setError(message);
      toast(message, "error");
      setLoading(false);
      return;
    }
    toast("수정했어요", "success");
    router.refresh();
    setEditing(false);
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="수정"
        className="rounded p-1 text-admin-muted opacity-0 transition-opacity hover:bg-admin-content hover:text-admin-blue group-hover:opacity-100"
      >
        <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="M9.5 2.5l2 2L5 11l-2.5.5L3 9zM8.5 3.5l2 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <DeleteManualEntry id={entry.id} />

      {editing && (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-admin-bg/60 p-4 backdrop-blur-sm"
          onClick={() => !loading && setEditing(false)}
        >
          <form
            onSubmit={submit}
            onClick={(ev) => ev.stopPropagation()}
            className="my-8 w-full max-w-2xl rounded-xl border border-admin-border bg-admin-surface p-5 text-left shadow-[var(--shadow-e2)]"
          >
            <p className="text-sm font-semibold text-admin-text">장부 항목 수정</p>
            <p className="mt-0.5 text-xs text-admin-muted">모든 칸을 고칠 수 있습니다.</p>

            <LedgerFields
              defaults={entry}
              conversations={conversations}
            />

            {error && <p className="mt-3 text-xs text-admin-red">{error}</p>}

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-admin-blue px-4 py-2 text-xs font-semibold text-admin-bg disabled:opacity-50"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-admin-muted hover:text-admin-text"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// 사이트 결제/환불(자동 행)용 — 증빙 수단·세금계산서 발행일·비고만 채웁니다.
// 금액·날짜·고객은 결제 사실이라 못 고칩니다.
export function AutoEntryProof({
  entry,
}: {
  entry: { id: string; proofType?: string | null; taxInvoiceIssuedAt?: Date | string | null; memo?: string | null };
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [taxDate, setTaxDate] = useState(toLocalDate(entry.taxInvoiceIssuedAt));
  const [source, rawId] = entry.id.split(":");
  const hasProof = Boolean(entry.proofType || entry.taxInvoiceIssuedAt || entry.memo);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/ledger/proof", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        id: rawId,
        proofType: String(fd.get("proofType") ?? ""),
        taxInvoiceIssuedAt: taxDate,
        memo: String(fd.get("memo") ?? "").trim(),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = body?.error ?? "저장에 실패했습니다.";
      setError(message);
      toast(message, "error");
      setLoading(false);
      return;
    }
    toast("증빙 정보를 저장했어요", "success");
    router.refresh();
    setOpen(false);
    setLoading(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="증빙 정보"
        title="증빙 수단·세금계산서 정보"
        className={`rounded p-1 transition-opacity hover:bg-admin-content hover:text-admin-blue ${
          hasProof ? "text-admin-blue opacity-100" : "text-admin-muted opacity-0 group-hover:opacity-100"
        }`}
      >
        <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="M3 1.5h5.5L11 4v8.5H3zM8 1.5V4h3M4.8 7h4.4M4.8 9.2h4.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-admin-bg/60 p-4 backdrop-blur-sm"
          onClick={() => !loading && setOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(ev) => ev.stopPropagation()}
            className="my-12 w-full max-w-md rounded-xl border border-admin-border bg-admin-surface p-5 text-left shadow-[var(--shadow-e2)]"
          >
            <p className="text-sm font-semibold text-admin-text">증빙 정보</p>
            <p className="mt-0.5 text-xs text-admin-muted">
              사이트 결제 건입니다 — 금액·날짜·고객은 결제 기록이라 고칠 수 없고, 세금 신고용
              증빙만 채웁니다.
            </p>

            <div className="mt-4 space-y-3">
              <div className="text-xs font-medium text-admin-muted">
                증빙 수단
                <AdminSelect
                  name="proofType"
                  defaultValue={entry.proofType ?? ""}
                  placeholder="선택 안 함"
                  options={[
                    { value: "", label: "선택 안 함" },
                    { value: "TAX_INVOICE", label: "세금계산서" },
                    { value: "CASH_RECEIPT", label: "현금영수증" },
                    { value: "TRANSFER_RECORD", label: "계좌이체 내역" },
                    { value: "NONE", label: "없음" },
                  ]}
                />
              </div>
              <div className="text-xs font-medium text-admin-muted">
                세금계산서 발행일 <span className="font-normal">(선택)</span>
                <div className="mt-1.5 [&>div>button:first-child]:w-full [&>div>button:first-child]:justify-start [&>div>button:first-child]:bg-admin-content">
                  <DatePicker value={taxDate} onChange={setTaxDate} placeholder="미발행" />
                </div>
              </div>
              <label className="block text-xs font-medium text-admin-muted">
                비고
                <input
                  name="memo"
                  maxLength={1000}
                  defaultValue={entry.memo ?? ""}
                  className={`mt-1.5 ${inputCls}`}
                />
              </label>
            </div>

            {error && <p className="mt-3 text-xs text-admin-red">{error}</p>}

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-admin-blue px-4 py-2 text-xs font-semibold text-admin-bg disabled:opacity-50"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium text-admin-muted hover:text-admin-text"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export function DeleteManualEntry({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm("이 장부 항목을 삭제할까요?")) return;
    setLoading(true);
    const res = await fetch(`/api/admin/ledger/entries/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast(body?.error ?? "삭제에 실패했습니다.", "error");
      setLoading(false);
      return;
    }
    toast("삭제했어요", "success");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={loading}
      aria-label="삭제"
      className="rounded p-1 text-admin-muted opacity-0 transition-opacity hover:bg-admin-red-soft hover:text-admin-red group-hover:opacity-100 disabled:opacity-50"
    >
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden>
        <path
          d="M3 3l8 8M11 3l-8 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
