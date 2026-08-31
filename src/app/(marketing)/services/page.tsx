import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ProcessStepper } from "@/components/marketing/ProcessStepper";
import { SERVICES, PROCESS_STEPS } from "@/lib/content";
import { jsonLdScript } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "서비스",
  description:
    "업무 자동화 프로그램, 카카오톡·텔레그램 챗봇 개발, API·웹훅 연동, 출시 후 유지보수까지. 필요한 부분만 맡기거나 기획부터 운영까지 전체를 맡길 수 있습니다.",
  alternates: { canonical: "/services" },
};

const SERVICES_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: SERVICES.map((service, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: service.title,
      description: service.description,
      url: absoluteUrl(`/services#${service.slug}`),
      provider: { "@type": "ProfessionalService", name: "MOVD" },
      areaServed: "KR",
    },
  })),
};

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(SERVICES_JSON_LD) }}
      />

      <section className="pt-20 pb-16 md:pt-28">
        <Container>
          <h1 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            뭘 하나
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            필요한 것만 골라도 되고, 처음부터 끝까지 다 맡겨도 됩니다.
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="border-t border-line">
            {SERVICES.map((service, i) => (
              <div
                key={service.slug}
                id={service.slug}
                className="scroll-mt-28 grid gap-x-8 gap-y-4 border-b border-line py-10 md:grid-cols-[3rem_1fr] md:py-12"
              >
                <span className="font-display text-sm font-extrabold tabular-nums text-accent md:pt-1.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="md:grid md:grid-cols-[16rem_1fr] md:gap-10">
                  <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">
                    {service.title}
                  </h2>
                  <div className="mt-3 md:mt-0">
                    <p className="text-sm leading-relaxed text-muted md:text-[15px]">
                      {service.description}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft">
                      {service.points.map((point) => (
                        <li key={point} className="flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-accent" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-line py-20 md:py-28">
        <Container>
          <h2 className="max-w-lg font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">
            일하는 순서
          </h2>
          <ProcessStepper steps={PROCESS_STEPS} />
        </Container>
      </section>

      <section className="py-20 md:py-28">
        <Container>
          <CtaBand
            title="뭐가 필요한지 몰라도 됩니다"
            description="상황만 말씀해 주시면 방법은 같이 찾습니다."
            cta="채팅으로 물어보기"
          >
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              자주 묻는 질문
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </CtaBand>
        </Container>
      </section>
    </>
  );
}
