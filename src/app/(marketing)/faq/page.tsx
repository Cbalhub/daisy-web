import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { FAQ_ITEMS } from "@/lib/content";
import { jsonLdScript } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: "OverCook에 문의하기 전 궁금한 점들을 미리 확인해보세요.",
  alternates: { canonical: "/faq" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function FaqPage() {
  return (
    <section className="pt-20 pb-24 md:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />
      <Container>
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">FAQ</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            자주 묻는 질문
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            상담 전에 궁금하실 만한 것들을 미리 정리했어요. 여기 없는 내용은 채팅으로 편하게 물어봐 주세요.
          </p>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="mt-12 max-w-2xl">
            <FaqAccordion items={FAQ_ITEMS.map((f) => ({ ...f }))} />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-16 rounded-3xl bg-paper-dim px-8 py-12 text-center">
            <h2 className="font-display text-2xl font-semibold">더 궁금한 점이 있으신가요?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
              여기 없는 내용은 채팅으로 편하게 물어봐 주세요. 확인 후 바로 답변드려요.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <OpenChatButton>지금 상담하기</OpenChatButton>
              <Link
                href="/refund-policy"
                className="text-sm font-medium text-accent transition-opacity hover:opacity-70"
              >
                환불 정책 보기 &rarr;
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
