import { Container } from "@/components/ui/Container";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { Reveal } from "@/components/ui/Reveal";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { HeroShowcase } from "@/components/marketing/HeroShowcase";
import { ProcessStepper } from "@/components/marketing/ProcessStepper";
import { ReviewCard } from "@/components/marketing/ReviewCard";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { Mark } from "@/components/brand/Mark";
import { WorkTypeMarquee, Manifesto } from "@/components/marketing/HomeSections";
import {
  ChatbotFlow,
  ChatMiniCard,
  AutomationCard,
  WebhookFlow,
  ProgressTrackerMock,
} from "@/components/marketing/ProductMocks";
import { DashboardPanel } from "@/components/marketing/DashboardPanel";
import { prisma } from "@/lib/prisma";
import { PROCESS_STEPS, FAQ_ITEMS } from "@/lib/content";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 300;

const CAPABILITIES = [
  {
    title: "카카오톡 · 텔레그램 챗봇",
    description:
      "상담, 주문 접수, 예약 알림까지 챗봇이 받게 합니다. 시나리오부터 같이 짜서 처음부터 만듭니다.",
    visual: <ChatbotFlow />,
  },
  {
    title: "실시간 채팅 상담",
    description:
      "화면 우측 상단 ‘프로젝트 문의’ 버튼이 바로 그 결과물이에요. 방문자와 바로 연결되고, 대화·파일·결제 요청까지 한 창에서.",
    visual: <ChatMiniCard />,
  },
  {
    title: "업무 자동화 스크립트",
    description:
      "반복되는 수작업, 데이터 정리, 문서 처리를 프로그램이 대신하게 만듭니다. 정해진 시각에 알아서 도는 배치까지.",
    visual: <AutomationCard />,
  },
  {
    title: "관리자 대시보드 · 자동 장부",
    description:
      "이 사이트의 매출 캘린더·장부도 저희가 직접 만든 관리자 도구예요. 결제·정산·고객 관리를 한 화면에서.",
    visual: <DashboardPanel />,
  },
  {
    title: "외부 API · 웹훅 연동",
    description:
      "여러 서비스를 하나로 잇습니다. 한쪽에서 일이 생기면 다른 쪽이 알아서 다음 걸 처리하게.",
    visual: <WebhookFlow />,
  },
];

const WHY_US = [
  {
    title: "예산부터 물어봅니다",
    description:
      "견적서를 먼저 들이밀지 않아요. 예산을 듣고, 그 안에서 뭘 할 수 있는지 정리해 드립니다.",
  },
  {
    title: "대표가 끝까지 합니다",
    description: "상담, 개발, 배포까지 담당자가 안 바뀝니다. 중간에 말이 새지 않아요.",
  },
  {
    title: "납품 후에도 봅니다",
    description: "버그 나면 고치고, 장애 나면 대응합니다. 끝나고 연락 끊기지 않아요.",
  },
  {
    title: "지금 어느 단계인지 보입니다",
    description: "채팅이랑 마이페이지에서 진행 상황을 바로 확인할 수 있어요.",
  },
];

export default async function HomePage() {
  const [portfolioItems, reviews] = await Promise.all([
    prisma.portfolioItem.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 6,
    }),
    prisma.review.findMany({
      where: { publishedAt: { not: null } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ]);

  return (
    <>
      {/* 히어로 */}
      <section className="border-b border-line py-12 md:py-20">
        <Container>
          <div className="grid gap-x-0 gap-y-12 lg:grid-cols-[minmax(0,22rem)_1fr]">
            <div className="flex flex-col lg:border-r lg:border-line lg:pr-12">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                소프트웨어 개발 외주
              </p>
              <h1 className="mt-4 font-display text-[1.9rem] leading-[1.14] font-extrabold tracking-tight text-balance sm:text-[2.4rem]">
                카톡 봇, 자동화, 관리자 페이지.
                <br />
                대표가 직접 만듭니다.
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-soft">
                이 사이트의 채팅·결제·관리자 도구도 전부 저희가 만들었어요.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 lg:mt-auto lg:pt-8">
                <OpenChatButton>프로젝트 문의</OpenChatButton>
                <Link
                  href="/portfolio"
                  className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
                >
                  포트폴리오 &rarr;
                </Link>
              </div>
            </div>

            <div className="min-w-0 lg:pl-12">
              <HeroShowcase />
            </div>
          </div>
        </Container>
      </section>

      {/* 4. 이런 걸 만들었어요 — 마퀴 */}
      <WorkTypeMarquee />

      {/* 무엇을 만드나 — 텍스트 + 제품 목업 교차 */}
      <section className="border-b border-line py-20 md:py-28">
        <Container>
          <div className="max-w-lg">
            <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">
              뭘 만드나
            </h2>
            <Link
              href="/services"
              className="mt-4 inline-block text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              서비스 자세히 &rarr;
            </Link>
          </div>

          <div className="mt-16 space-y-14 md:space-y-20">
            {CAPABILITIES.map((item, i) => (
              <Reveal key={item.title}>
                <div className="grid items-center gap-x-12 gap-y-7 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                  <div className={cn("md:order-1", i % 2 === 1 && "md:order-2")}>
                    <span className="font-display text-sm font-extrabold tabular-nums text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">
                      {item.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-xl border border-line bg-paper p-5 shadow-[var(--shadow-e2)] sm:p-9 md:order-2",
                      i % 2 === 1 && "md:order-1"
                    )}
                  >
                    {item.visual}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* 1+2+3. 다크 매니페스토 */}
      <Manifesto />

      {/* 왜 MOVD */}
      <section className="border-t border-line py-20 md:py-28">
        <Container>
          <div className="grid gap-x-14 gap-y-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">
                왜 MOVD인가
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
                외주 처음 맡겨보는 분들이 많아요. 그래서 이렇게 합니다.
              </p>
              <ul className="mt-8 divide-y divide-line border-t border-line">
                {WHY_US.map((item) => (
                  <li key={item.title} className="py-5">
                    <h3 className="font-display text-[15px] font-semibold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:pt-4">
              <ProgressTrackerMock />
              <p className="mt-3 text-xs leading-relaxed text-muted">
                결제한 프로젝트는 마이페이지에서 지금 어느 단계인지, 다음이 뭔지 이렇게 보입니다.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 진행 과정 */}
      <section className="border-t border-line py-20 md:py-28">
        <Container>
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">
            일하는 순서
          </h2>
          <ProcessStepper steps={PROCESS_STEPS} />
        </Container>
      </section>

      {/* 포트폴리오 미리보기 */}
      {portfolioItems.length > 0 && (
        <section className="border-t border-line py-20 md:py-28">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-balance md:text-[2rem]">
                최근 진행한 프로젝트
              </h2>
              <Link
                href="/portfolio"
                className="text-sm font-semibold text-accent transition-opacity hover:opacity-70"
              >
                전체 보기 &rarr;
              </Link>
            </div>

            <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {portfolioItems.map((item) => (
                <Link
                  key={item.slug}
                  href={`/portfolio/${item.slug}`}
                  className="group block transition-transform duration-300 ease-out hover:-translate-y-1"
                >
                  {item.images[0] ? (
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line shadow-[var(--shadow-e1)] transition-shadow duration-300 group-hover:shadow-[var(--shadow-e2)]">
                      <Image
                        src={item.images[0]}
                        alt={item.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : (
                    <PlaceholderArt
                      label={item.category}
                      className="aspect-[16/10] shadow-[var(--shadow-e1)] transition-shadow duration-300 group-hover:shadow-[var(--shadow-e2)]"
                    />
                  )}
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-[15px] font-semibold transition-colors group-hover:text-accent">
                      {item.title}
                    </h3>
                    <span className="shrink-0 text-xs text-muted">
                      {item.category}
                      {item.duration ? ` · ${item.duration}` : ""}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted">{item.summary}</p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 후기 */}
      {reviews.length > 0 && (
        <section className="border-t border-line py-20 md:py-28">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-[2rem]">
                받은 후기
              </h2>
              <Link
                href="/reviews"
                className="text-sm font-semibold text-accent transition-opacity hover:opacity-70"
              >
                더 보기 &rarr;
              </Link>
            </div>

            <div
              className={cn(
                "mt-10 grid gap-x-10 gap-y-8",
                reviews.length === 1 && "max-w-xl",
                reviews.length === 2 && "sm:grid-cols-2",
                reviews.length >= 3 && "sm:grid-cols-2 lg:grid-cols-3"
              )}
            >
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 7. FAQ 미리보기 */}
      <section className="border-t border-line py-20 md:py-28">
        <Container>
          <div className="grid gap-x-14 gap-y-8 md:grid-cols-[18rem_1fr]">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-balance md:text-[2rem]">
                자주 묻는 질문
              </h2>
              <Link
                href="/faq"
                className="mt-4 inline-block text-sm font-semibold text-accent transition-opacity hover:opacity-70"
              >
                전체 보기 &rarr;
              </Link>
            </div>
            <div className="max-w-2xl">
              <FaqAccordion items={FAQ_ITEMS.slice(0, 3).map((f) => ({ ...f }))} />
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="border-t border-line py-20 text-center md:py-28">
        <Container>
          <Mark variant="brand" className="mx-auto mb-6 h-9 w-9" />
          <h2 className="mx-auto max-w-xl font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            만들고 싶은 거 있으세요?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            채팅으로 상황만 알려 주시면 됩니다. 보통 하루 안에 답 드리고, 견적부터 같이 봅니다.
          </p>
          <div className="mt-8 flex justify-center">
            <OpenChatButton>프로젝트 문의</OpenChatButton>
          </div>
        </Container>
      </section>
    </>
  );
}
