import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FAQ_ITEMS } from "@/lib/content";
import { jsonLdScript, breadcrumbJsonLd } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site";
import { getBusinessSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description:
    "상담 방법, 견적 시점, 결제(무통장입금) 방식, 제작 기간, 진행 상황 확인, 유지보수, 환불까지 — 문의 전에 자주 묻는 질문을 정리했습니다.",
  alternates: { canonical: "/faq" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    breadcrumbJsonLd([
      ["홈", absoluteUrl("/")],
      ["자주 묻는 질문", absoluteUrl("/faq")],
    ]),
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ],
};

export default async function FaqPage() {
  const settings = await getBusinessSettings();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />
      <section className="pt-20 pb-16 md:pt-28">
        <Container>
          <h1 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            자주 묻는 질문
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            상담 전에 궁금할 만한 것들 정리했어요. 여기 없는 건 채팅으로 물어봐 주세요.
          </p>

          <div className="mt-12 max-w-2xl">
            <FaqAccordion items={FAQ_ITEMS.map((f) => ({ ...f }))} />
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <CtaBand
            title="더 궁금한 거 있으세요?"
            description={
              settings.businessHours
                ? `여기 없는 건 채팅으로 물어봐 주세요. 상담 가능 시간: ${settings.businessHours}`
                : "여기 없는 건 채팅으로 물어봐 주세요. 확인하고 바로 답 드려요."
            }
            cta="채팅으로 물어보기"
          >
            <Link
              href="/refund-policy"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              환불 정책 보기
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </CtaBand>
        </Container>
      </section>
    </>
  );
}
