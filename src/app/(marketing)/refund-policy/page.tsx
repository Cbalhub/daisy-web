import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { REFUND_POLICY_SECTIONS } from "@/lib/refundPolicy";

export const metadata: Metadata = {
  title: "환불 정책",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <section className="pt-20 pb-24 md:pt-28">
      <Container className="max-w-2xl">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">환불 정책</h1>
        <p className="mt-4 text-sm text-muted">
          아래는 표준 템플릿입니다. 실제 계약 조건에 맞게 법률 검토 후
          수정해 주세요.
        </p>

        <div className="mt-10 space-y-7 text-sm leading-[1.75] text-ink-soft">
          {REFUND_POLICY_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-base font-semibold text-ink">{section.title}</h2>
              {section.body.map((line) => (
                <p key={line} className="mt-2">
                  {line}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-12 text-xs text-muted">최종 수정일: 2026년 8월 18일</p>
      </Container>
    </section>
  );
}
