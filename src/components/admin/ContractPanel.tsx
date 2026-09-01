"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import { DatePicker } from "@/components/admin/ui/DatePicker";

type ContractStatus = "DRAFT" | "SENT" | "SIGNED" | "VOID";

export type ContractRow = {
  id: string;
  token: string;
  status: ContractStatus;
  amount: number;
  number: string;
  // 서버에서 만든 표시 문자열 — "홍길동 서명 · 2026. 9. 1. 오후 8:11" 등.
  // (클라이언트에서 Date 를 다시 포맷하면 서버/클라 결과가 어긋나 하이드레이션 오류)
  meta: string;
  integrity: "verified" | "mismatch" | "unavailable" | null;
};

const STATUS: Record<ContractStatus, { label: string; tone: "neutral" | "blue" | "green" | "amber" }> = {
  DRAFT: { label: "초안", tone: "neutral" },
  SENT: { label: "서명 대기", tone: "amber" },
  SIGNED: { label: "서명 완료", tone: "green" },
  VOID: { label: "무효", tone: "neutral" },
};

const inputCls =
  "w-full rounded-lg border border-admin-border bg-admin-content px-3 py-2 text-sm outline-none focus:border-admin-blue";

const POLL_MS = 10_000;

export function ContractPanel({
  orderId,
  siteUrl,
  defaultAmount,
  defaultClientBizNo,
  contracts,
}: {
  orderId: string;
  siteUrl: string;
  defaultAmount: number;
  defaultClientBizNo: string;
  contracts: ContractRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const signed = contracts.find((c) => c.status === "SIGNED") ?? null;
  const active = contracts.find((c) => c.status === "SENT") ?? null;
  const linkFor = (token: string) => `${siteUrl}/contract/${token}`;

  // 서명 대기 중인 계약서가 있으면, 고객이 다른 기기에서 서명했을 때 이 화면이
  // 저절로 갱신되도록 주기적으로 서버 컴포넌트를 다시 조회합니다. 서명되면
  // active 가 사라져 폴링도 멈춥니다. (Slack/이메일로도 별도 알림이 갑니다.)
  const waitingToken = active && !signed ? active.token : null;
  useEffect(() => {
    if (!waitingToken) return;
    const timer = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [waitingToken, router]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const amountRaw = String(fd.get("amount") ?? "").replace(/[,\s]/g, "");
    const payload = {
      scope: String(fd.get("scope") ?? "").trim(),
      amount: Number(amountRaw),
      startDate,
      endDate,
      warrantyMonths: Number(String(fd.get("warrantyMonths") ?? "1")),
      paymentTerms: String(fd.get("paymentTerms") ?? "").trim(),
      specialTerms: String(fd.get("specialTerms") ?? "").trim(),
      clientBizNo: String(fd.get("clientBizNo") ?? "").trim(),
    };

    setLoading(true);
    const res = await fetch(`/api/admin/orders/${orderId}/contract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = body?.error ?? "계약서 발송에 실패했어요.";
      setError(message);
      toast(message, "error");
      setLoading(false);
      return;
    }

    if (body?.emailFailed) {
      toast("계약서는 만들어졌지만 이메일 발송에 실패했어요. 링크를 직접 보내주세요.", "error");
    } else {
      toast("계약서를 보냈어요", "success");
    }
    router.refresh();
    setOpen(false);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-admin-text">용역계약서</h2>
        {!signed && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-admin-border px-3 py-1.5 text-xs font-medium text-admin-text transition-colors hover:border-admin-blue hover:text-admin-blue"
          >
            {open ? "닫기" : active ? "다시 작성해 보내기" : "계약서 만들기"}
          </button>
        )}
      </div>

      {contracts.length === 0 && !open && (
        <p className="mt-3 text-sm text-admin-muted">
          아직 발행한 계약서가 없습니다. 고객명·연락처·금액은 이 주문에서 자동으로 채워집니다.
        </p>
      )}

      {contracts.length > 0 && (
        <ul className="mt-3 space-y-2">
          {contracts.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-admin-border bg-admin-content px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminBadge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</AdminBadge>
                  <span className="text-sm font-medium text-admin-text tabular-nums">
                    ₩{c.amount.toLocaleString("ko-KR")}
                  </span>
                  <span className="text-xs text-admin-muted tabular-nums">{c.number}</span>
                  {c.integrity === "verified" && (
                    <span className="text-xs font-medium text-admin-green">무결성 ✓</span>
                  )}
                  {c.integrity === "mismatch" && (
                    <span className="text-xs font-medium text-admin-red">무결성 ⚠ 불일치</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-admin-muted">{c.meta}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={linkFor(c.token)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-admin-border bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-text transition-colors hover:border-admin-blue"
                >
                  계약서 보기
                </a>
                {c.status !== "VOID" && <CopyLinkButton text={linkFor(c.token)} />}
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && !signed && (
        <form
          onSubmit={submit}
          className="mt-4 rounded-xl border border-admin-border bg-admin-surface p-5"
        >
          <p className="text-sm font-semibold text-admin-text">계약 조건</p>
          <p className="mt-0.5 text-xs text-admin-muted">
            고객명·연락처·금액은 이 주문에서 자동으로 채워집니다. 아래 조건만 입력하면 계약서를 만들어
            고객 이메일로 서명 링크를 보냅니다.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-admin-muted">
              용역 범위 <span className="font-normal">(한 줄에 하나씩. 그대로 제2조 항목이 됩니다)</span>
              <textarea
                name="scope"
                required
                rows={4}
                maxLength={5000}
                placeholder={"카카오톡 챗봇 개발 및 채널 연동\n관리자 페이지(주문·문의 관리)\n서버 배포 및 3개월 안정화 지원"}
                className={`mt-1.5 ${inputCls} resize-y`}
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="text-xs font-medium text-admin-muted">
                착수 예정일
                <div className="mt-1.5 [&>div>button:first-child]:w-full [&>div>button:first-child]:justify-start [&>div>button:first-child]:bg-admin-content">
                  <DatePicker value={startDate} onChange={setStartDate} placeholder="협의" />
                </div>
              </div>
              <div className="text-xs font-medium text-admin-muted">
                납품 예정일
                <div className="mt-1.5 [&>div>button:first-child]:w-full [&>div>button:first-child]:justify-start [&>div>button:first-child]:bg-admin-content">
                  <DatePicker value={endDate} onChange={setEndDate} placeholder="협의" />
                </div>
              </div>
              <label className="text-xs font-medium text-admin-muted">
                계약 금액 (KRW, 부가세 별도)
                <input
                  name="amount"
                  required
                  inputMode="numeric"
                  defaultValue={String(defaultAmount)}
                  className={`mt-1.5 ${inputCls} tabular-nums`}
                />
              </label>
              <label className="text-xs font-medium text-admin-muted">
                무상 하자보수 (개월)
                <input
                  name="warrantyMonths"
                  type="number"
                  min={0}
                  max={36}
                  defaultValue={1}
                  className={`mt-1.5 ${inputCls} tabular-nums`}
                />
              </label>
            </div>

            <label className="block text-xs font-medium text-admin-muted">
              지급 조건 <span className="font-normal">(비우면 기본 문구)</span>
              <input
                name="paymentTerms"
                maxLength={1000}
                placeholder="예: 계약 시 50%, 납품 검수 후 50%"
                className={`mt-1.5 ${inputCls}`}
              />
            </label>

            <label className="block text-xs font-medium text-admin-muted">
              고객 사업자등록번호 <span className="font-normal">(사업자면)</span>
              <input
                name="clientBizNo"
                maxLength={20}
                defaultValue={defaultClientBizNo}
                className={`mt-1.5 ${inputCls} tabular-nums`}
              />
            </label>

            <label className="block text-xs font-medium text-admin-muted">
              특약사항 <span className="font-normal">(선택 — 한 줄에 하나씩)</span>
              <textarea
                name="specialTerms"
                rows={2}
                maxLength={3000}
                className={`mt-1.5 ${inputCls} resize-y`}
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
              {loading ? "보내는 중…" : "계약서 만들고 보내기"}
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
      )}
    </div>
  );
}
