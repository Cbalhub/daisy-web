import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SERVICES, PROCESS_STEPS } from "@/lib/content";
import { jsonLdScript } from "@/lib/json-ld";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "서비스",
  description: "OverCook이 제공하는 업무 자동화, 챗봇 개발, API 연동, 유지보수 서비스를 소개합니다.",
  alternates: { canonical: "/services" },
};

// bento 섹션에서 쓴 것과 같은 아이콘 언어를 이어가서, 홈에서 본 아이콘을 여기서도
// 알아볼 수 있게 합니다. 서비스는 순서가 있는 단계가 아니라 서로 독립적인
// 항목이라, 숫자(01/02/03) 대신 의미를 담은 아이콘을 씁니다.
const SERVICE_ICONS: Record<string, React.ReactNode> = {
  automation: (
    <>
      <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8" />
      <path d="M20 4v4h-4" />
      <path d="M20 12a8 8 0 0 1-13.7 5.7L4 16" />
      <path d="M4 20v-4h4" />
    </>
  ),
  chatbot: (
    <>
      <path d="M4.5 7A2.5 2.5 0 0 1 7 4.5h10A2.5 2.5 0 0 1 19.5 7v6A2.5 2.5 0 0 1 17 15.5h-6l-4 3.5V15.5H7A2.5 2.5 0 0 1 4.5 13v-6Z" />
      <circle cx="9" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  integration: (
    <>
      <path d="M9 15 15 9" />
      <path d="M10.5 5.5 13 3a3.2 3.2 0 0 1 4.5 4.5l-2.5 2.5" />
      <path d="M13.5 18.5 11 21a3.2 3.2 0 0 1-4.5-4.5l2.5-2.5" />
    </>
  ),
  maintenance: (
    <>
      <path d="M12 3.5 5 6v5.5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-2.5Z" />
      <path d="M9 12l2 2 4-4.5" />
    </>
  ),
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
      url: `https://overcook.kr/services#${service.slug}`,
      provider: { "@type": "ProfessionalService", name: "OverCook" },
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
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Services
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              기획부터 운영까지, 하나의 팀으로
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              프로젝트 규모와 목적에 맞춰 필요한 부분만 선택하거나, 처음부터
              끝까지 전체 과정을 맡길 수 있습니다.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid gap-6">
            {SERVICES.map((service, i) => (
              <div key={service.slug} id={service.slug} className="scroll-mt-28">
                <Reveal delay={i * 0.05}>
                  <Card className="grid gap-6 md:grid-cols-[1fr_2fr] md:items-center">
                    <div className={cn(i % 2 === 1 && "md:order-2")}>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          {SERVICE_ICONS[service.slug]}
                        </svg>
                      </div>
                      <h2 className="mt-4 font-display text-2xl font-semibold">
                        {service.title}
                      </h2>
                    </div>
                    <div className={cn(i % 2 === 1 && "md:order-1")}>
                      <p className="text-sm leading-relaxed text-muted md:text-base">
                        {service.description}
                      </p>
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {service.points.map((point) => (
                          <li
                            key={point}
                            className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft"
                          >
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </Reveal>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-paper-dim py-24">
        <Container>
          <SectionHeading
            kicker="Process"
            title="일하는 방식"
            align="center"
            className="mx-auto"
          />
          <RevealGroup className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-3">
            {PROCESS_STEPS.map((step) => (
              <RevealItem key={step.step}>
                <div className="flex gap-4">
                  <span className="font-display text-2xl font-semibold text-accent">
                    {step.step}
                  </span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section className="py-24">
        <Container>
          <Reveal>
            <div className="rounded-3xl bg-ink px-8 py-16 text-center text-paper md:px-16">
              <h2 className="font-display text-3xl font-semibold text-balance md:text-4xl">
                어떤 서비스가 필요한지 아직 모르셔도 괜찮아요
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-paper/60">
                상황을 알려주시면 가장 적합한 방향을 함께 찾아드립니다.
              </p>
              <div className="mt-8 flex justify-center">
                <Button
                  href="/contact"
                  size="lg"
                  className="bg-accent hover:bg-paper hover:text-ink"
                >
                  무료 상담 신청하기
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
