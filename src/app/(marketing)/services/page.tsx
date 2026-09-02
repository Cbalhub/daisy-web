import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { CtaBand } from "@/components/marketing/CtaBand";
import { ProcessStepper } from "@/components/marketing/ProcessStepper";
import {
  AutomationCard,
  ChatbotFlow,
  WebhookFlow,
  MonitorCard,
} from "@/components/marketing/ProductMocks";
import { SERVICES, PROCESS_STEPS } from "@/lib/content";
import { jsonLdScript, breadcrumbJsonLd } from "@/lib/json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const VISUALS: Record<string, React.ReactNode> = {
  automation: <AutomationCard />,
  chatbot: <ChatbotFlow />,
  integration: <WebhookFlow />,
  maintenance: <MonitorCard />,
};

export const metadata: Metadata = {
  title: "서비스",
  description:
    "업무 자동화 프로그램, 카카오톡·텔레그램 챗봇 개발, API·웹훅 연동, 출시 후 유지보수까지. 필요한 부분만 맡기거나 기획부터 운영까지 전체를 맡길 수 있습니다.",
  alternates: { canonical: "/services" },
};

const SERVICES_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    breadcrumbJsonLd([
      ["홈", absoluteUrl("/")],
      ["서비스", absoluteUrl("/services")],
    ]),
    {
      "@type": "ItemList",
      itemListElement: SERVICES.map((service, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Service",
          name: service.title,
          serviceType: service.title,
          description: service.description,
          url: absoluteUrl(`/services#${service.slug}`),
          provider: { "@type": "ProfessionalService", name: "MOVD", "@id": `${SITE_URL}/#org` },
          areaServed: { "@type": "Country", name: "대한민국" },
        },
      })),
    },
  ],
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
            무엇을 만드나요
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            필요한 것만 골라도 되고, 처음부터 끝까지 다 맡겨도 됩니다.
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="space-y-16 md:space-y-24">
            {SERVICES.map((service, i) => (
              <div
                key={service.slug}
                id={service.slug}
                className="scroll-mt-28 grid items-center gap-x-12 gap-y-7 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
              >
                <div className={cn("md:order-1", i % 2 === 1 && "md:order-2")}>
                  <span className="font-display text-sm font-extrabold tabular-nums text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
                    {service.title}
                  </h2>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">
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
                <div
                  className={cn(
                    "rounded-2xl bg-paper-dim p-4 sm:p-6 md:order-2",
                    i % 2 === 1 && "md:order-1"
                  )}
                >
                  {VISUALS[service.slug]}
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
