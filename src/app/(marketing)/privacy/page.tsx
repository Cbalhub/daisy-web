import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PRIVACY_POLICY_SECTIONS } from "@/lib/privacyPolicy";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <section className="pt-20 pb-24 md:pt-28">
      <Container className="max-w-2xl">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          개인정보처리방침
        </h1>
        <p className="mt-4 text-sm text-muted">
          아래는 표준 템플릿입니다. 개인정보보호법에 따라 실제 수집 항목과
          처리 방식에 맞게 법률 검토 후 수정해 주세요.
        </p>

        <div className="mt-10 space-y-7 text-sm leading-[1.75] text-ink-soft">
          {PRIVACY_POLICY_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-base font-semibold text-ink">
                {section.title}
              </h2>
              {section.body.length > 1 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {section.body.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">{section.body[0]}</p>
              )}
            </section>
          ))}
        </div>

        <p className="mt-12 text-xs text-muted">최종 수정일: 2026년 8월 18일</p>
      </Container>
    </section>
  );
}
