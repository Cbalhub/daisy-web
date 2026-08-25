import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "환불 정책",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <section className="pt-20 pb-24 md:pt-28">
      <Container className="max-w-3xl">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">환불 정책</h1>
        <p className="mt-4 text-sm text-muted">
          아래는 표준 템플릿입니다. 실제 계약 조건에 맞게 법률 검토 후
          수정해 주세요.
        </p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-ink-soft">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">
              1. 착수 전 취소
            </h2>
            <p className="mt-2">
              프로젝트 착수(기획 착수일 기준) 이전에 취소하는 경우, 결제 금액
              전액을 환불합니다.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">
              2. 착수 후 취소
            </h2>
            <p className="mt-2">
              프로젝트 착수 이후에는 진행된 작업 범위에 따라 실비를 공제한
              금액을 환불합니다. 공제 기준은 계약서에 명시된 마일스톤을
              따릅니다.
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">
              3. 환불 절차
            </h2>
            <p className="mt-2">
              환불 요청은{" "}
              <a href="/contact" className="text-accent underline">
                문의하기
              </a>
              를 통해 접수하며, 결제와 동일한 수단으로 영업일 기준 3~5일 이내
              환불 처리됩니다.
            </p>
          </section>
        </div>

        <p className="mt-12 text-xs text-muted">최종 수정일: 2026년 8월 18일</p>
      </Container>
    </section>
  );
}
