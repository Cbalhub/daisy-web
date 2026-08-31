import type { ContractSection, CompanySnapshot } from "@/lib/contract";
import { formatSeoulDateTime } from "@/lib/utils";

const DATE = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "Asia/Seoul" });

export type ContractView = {
  contractNumber: string;
  status: "DRAFT" | "SENT" | "SIGNED" | "VOID";
  amount: number;
  company: CompanySnapshot;
  client: { name: string; bizNo: string | null; email: string; phone: string | null };
  signedName: string | null;
  signedAt: string | null;
  signedIp: string | null;
  contentHash: string | null;
  signatureDataUrl: string | null;
  createdAt: string;
  sentAt: string | null;
  integrity: "verified" | "mismatch" | "unavailable";
};

/**
 * 계약서 본문 — 고객 화면과 인쇄(PDF 저장) 양쪽에서 같은 컴포넌트를 씁니다.
 * 서명 전이면 서명란이 비어 있고, 서명 후에는 서명 이미지·시각·해시가 함께 찍힙니다.
 */
export function ContractDocument({
  sections,
  view,
}: {
  sections: ContractSection[];
  view: ContractView;
}) {
  const signed = view.status === "SIGNED";
  const issuedAt = view.sentAt ?? view.createdAt;

  return (
    <article className="text-ink">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">소프트웨어 개발 용역계약서</h1>
          <p className="mt-1.5 text-xs text-muted">
            계약 번호 {view.contractNumber} · 발행일 {DATE.format(new Date(issuedAt))}
          </p>
        </div>
        <span
          className={
            "shrink-0 rounded-md border border-line px-2.5 py-1 text-xs font-medium " +
            (signed ? "text-success" : view.status === "VOID" ? "text-muted" : "text-ink-soft")
          }
        >
          {signed ? "서명 완료" : view.status === "VOID" ? "무효" : "서명 대기"}
        </span>
      </header>

      <section className="grid gap-5 border-b border-line py-6 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted">갑 (발주자)</p>
          <p className="mt-1.5 font-medium">{view.client.name}</p>
          {view.client.bizNo && (
            <p className="text-xs text-muted">사업자등록번호 {view.client.bizNo}</p>
          )}
          {view.client.phone && <p className="text-xs text-muted">{view.client.phone}</p>}
          <p className="text-xs text-muted">{view.client.email}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted">을 (수급자)</p>
          <p className="mt-1.5 font-medium">{view.company.name}</p>
          {view.company.repName && <p className="text-xs text-muted">대표 {view.company.repName}</p>}
          {view.company.bizNo && (
            <p className="text-xs text-muted">사업자등록번호 {view.company.bizNo}</p>
          )}
          {view.company.address && <p className="text-xs text-muted">{view.company.address}</p>}
          {view.company.phone && <p className="text-xs text-muted">{view.company.phone}</p>}
          {view.company.email && <p className="text-xs text-muted">{view.company.email}</p>}
        </div>
      </section>

      <div className="space-y-6 py-6">
        {sections.map((s) => (
          <section key={s.title} className="break-inside-avoid">
            <h2 className="text-sm font-semibold">{s.title}</h2>
            <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-soft">
              {s.body.map((line, i) => (
                <p key={i} className={line.startsWith("  ") ? "pl-4" : undefined}>
                  {line.trim()}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-line pt-6">
        <p className="text-sm text-ink-soft">
          위 계약 내용에 대하여 갑과 을은 상호 신의에 따라 성실히 이행할 것을 약정하며, 이를 증명하기 위해
          전자적 방법으로 서명한다.
        </p>
        {signed && view.signedAt && (
          <p className="mt-2 text-sm font-medium">체결일: {DATE.format(new Date(view.signedAt))}</p>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="rounded-lg border border-line p-4">
            <p className="text-xs font-medium text-muted">갑 (발주자)</p>
            <div className="mt-2 flex h-24 items-center justify-center rounded-md bg-paper-dim">
              {signed && view.signatureDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={view.signatureDataUrl}
                  alt={`${view.client.name} 서명`}
                  className="max-h-20 w-auto object-contain"
                />
              ) : (
                <span className="text-xs text-muted">서명 대기</span>
              )}
            </div>
            <p className="mt-2 text-sm">
              {view.client.name}
              {signed && view.signedName && view.signedName !== view.client.name && (
                <span className="text-muted"> (서명: {view.signedName})</span>
              )}
              <span className="text-muted"> (인)</span>
            </p>
          </div>

          <div className="rounded-lg border border-line p-4">
            <p className="text-xs font-medium text-muted">을 (수급자)</p>
            <div className="mt-2 flex h-24 items-center justify-center rounded-md bg-paper-dim">
              <span className="font-hand text-2xl text-ink">{view.company.name}</span>
            </div>
            <p className="mt-2 text-sm">
              {view.company.name}
              {view.company.repName ? ` · 대표 ${view.company.repName}` : ""}
              <span className="text-muted"> (인)</span>
            </p>
          </div>
        </div>
      </section>

      {signed && (
        <section className="mt-6 break-inside-avoid rounded-lg border border-line bg-paper-dim p-4 text-xs text-muted">
          <p className="font-medium text-ink-soft">전자서명 정보</p>

          {view.integrity === "verified" && (
            <p className="mt-1.5 text-sm font-medium text-success">
              ✓ 확인됨 — 서명 이후 계약 내용이 변경되지 않았습니다.
            </p>
          )}
          {view.integrity === "mismatch" && (
            <p className="mt-1.5 text-sm font-medium text-error">
              ⚠ 불일치 — 서명 이후 이 계약의 내용이 변경된 것으로 보입니다. 발행처에 문의해 주세요.
            </p>
          )}

          <dl className="mt-2 space-y-1">
            <Fact label="서명자">{view.signedName}</Fact>
            <Fact label="서명 시각">
              {view.signedAt ? formatSeoulDateTime(new Date(view.signedAt)) : "-"}
            </Fact>
            {view.signedIp && <Fact label="접속 IP">{view.signedIp}</Fact>}
            {view.contentHash && (
              <Fact label="무결성 해시">
                <span className="break-all">SHA-256 {view.contentHash}</span>
              </Fact>
            )}
          </dl>
          <p className="mt-2 leading-relaxed">
            위 값은 서명 시점의 계약 내용으로 계산되어 저장되었습니다. 이후 계약 금액·범위·서명이 변경되면
            해시가 달라져 위변조 여부를 확인할 수 있습니다.
          </p>
        </section>
      )}
    </article>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
