import type { Metadata } from "next";
import { Workflow, MessageSquareText, Webhook, Wrench } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ProcessStepper } from "@/components/marketing/ProcessStepper";
import { SERVICES, PROCESS_STEPS } from "@/lib/content";
import { jsonLdScript } from "@/lib/json-ld";

// 홈페이지 WHY_US/PROCESS/CAPABILITIES에서 쓴 것과 같은 꽃잎 색 순서 —
// 그림자 카드+파란 단색 배지로 남아있던 이 페이지도 같은 언어로 맞춥니다.
const PETAL_COLORS = [
  "var(--color-petal-yellow)",
  "var(--color-petal-pink)",
  "var(--color-petal-purple)",
  "var(--color-petal-blue)",
  "var(--color-petal-mint)",
  "var(--color-petal-orange)",
];

export const metadata: Metadata = {
  title: "서비스",
  description: "Daisy가 제공하는 업무 자동화, 챗봇 개발, API 연동, 유지보수 서비스를 소개합니다.",
  alternates: { canonical: "/services" },
};

// 손으로 그린 path 아이콘은 작은 원형 배지 안에서 뭉개져 보여서(예: integration의
// 체인 모양이 그냥 낙서처럼 보임), CAPABILITIES 섹션과 같은 lucide-react
// 아이콘으로 통일했습니다 — 같은 의미는 같은 아이콘을 재사용합니다.
const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  automation: Workflow,
  chatbot: MessageSquareText,
  integration: Webhook,
  maintenance: Wrench,
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
      provider: { "@type": "ProfessionalService", name: "Daisy" },
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

      {/* 그림자 있는 카드+파란 단색 아이콘 배지를 걷어내고, WHY_US와 같은
          헤어라인 구분 리스트 + 꽃잎 색 아이콘 배지로 맞췄습니다. */}
      <section className="pb-24">
        <Container>
          <div className="border-t border-line">
            {SERVICES.map((service, i) => (
              <div
                key={service.slug}
                id={service.slug}
                className="scroll-mt-28 border-b border-line py-10 md:grid md:grid-cols-[1fr_2fr] md:gap-10"
              >
                <Reveal delay={i * 0.05}>
                  <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-ink"
                      style={{ background: PETAL_COLORS[i % PETAL_COLORS.length] }}
                    >
                      {(() => {
                        const Icon = SERVICE_ICONS[service.slug];
                        return <Icon className="h-6 w-6" strokeWidth={1.5} />;
                      })()}
                    </span>
                    <h2 className="font-display text-xl font-semibold md:mt-4 md:text-2xl">
                      {service.title}
                    </h2>
                  </div>
                </Reveal>
                <Reveal delay={i * 0.05 + 0.05}>
                  <div className="mt-5 md:mt-0">
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
                </Reveal>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 홈페이지 PROCESS 섹션과 같은 스텝퍼 컴포넌트를 그대로 재사용해서,
          같은 6단계를 두 페이지에서 서로 다른 카드 스타일로 두 번 만드는
          일이 없게 했습니다. */}
      <section className="py-24">
        <Container>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Process
          </p>
          <h2 className="mx-auto mt-3 max-w-xl text-center font-display text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            일하는 방식
          </h2>
          <ProcessStepper steps={PROCESS_STEPS} />
        </Container>
      </section>

      {/* 검정 블록 대신 홈페이지 CTA와 같은 헤어라인 마무리로 통일 */}
      <section className="border-t border-line py-24">
        <Container>
          <Reveal>
            <div className="text-center">
              <h2 className="font-display text-3xl font-semibold text-balance md:text-4xl">
                어떤 서비스가 필요한지 아직 모르셔도 괜찮아요
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
                상황을 알려주시면 가장 적합한 방향을 함께 찾아드립니다.
              </p>
              <div className="mt-8 flex justify-center">
                <Button href="/contact" size="lg">
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
