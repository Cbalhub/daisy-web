import type { PortfolioItem } from "@prisma/client";
import { Container } from "@/components/ui/Container";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import { IconCheck, IconSliders, IconUser, IconHeartHand, IconLayers } from "@/components/ui/icons";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { Carousel } from "@/components/marketing/Carousel";
import { BrandMark } from "@/components/marketing/BrandMark";
import { ReviewCard } from "@/components/marketing/ReviewCard";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// 포트폴리오는 자주 바뀌지 않으므로, 매 요청마다 새로 렌더링하는 대신
// 5분 주기로만 다시 조회해 정적 페이지에 가까운 성능을 유지합니다.
export const revalidate = 300;

const STATS = [
  { value: 40, suffix: "+", label: "완료 프로젝트" },
  { value: 98, suffix: "%", label: "재계약 · 추천율" },
  { value: 24, suffix: "h", label: "평균 문의 응답" },
];

// 배열의 첫 항목(예산 맞춤 설계)이 대표님이 꼽은 가장 큰 차별점이라, 아래
// 렌더링에서 WHY_US[0]만 따로 꺼내 큰 인용구 카드로 강조하고 나머지는
// 리스트로 붙입니다 — 그래서 순서 자체가 의미를 가집니다.
const WHY_US = [
  {
    icon: <IconSliders className="h-5 w-5 text-white" />,
    title: "예산에 맞춰 설계합니다",
    description:
      "정해진 견적을 먼저 들이미는 대신, 예산을 먼저 여쭤보고 그 안에서 가장 효과적인 범위를 제안해요.",
  },
  {
    icon: <IconUser className="h-5 w-5" />,
    title: "대표가 처음부터 끝까지",
    description: "상담부터 기획, 개발, 배포까지 담당자가 바뀌지 않고 대표가 직접 진행해요.",
  },
  {
    icon: <IconHeartHand className="h-5 w-5" />,
    title: "출시 후에도 책임집니다",
    description: "납품하고 끝이 아니라, 버그·장애 대응까지 계속 함께해요.",
  },
  {
    icon: <IconLayers className="h-5 w-5" />,
    title: "진행 상황을 투명하게",
    description: "채팅과 마이페이지에서 지금 어느 단계인지 바로 확인할 수 있어요.",
  },
];

const CAPABILITIES = [
  {
    icon: (
      <>
        <path d="M4.5 7A2.5 2.5 0 0 1 7 4.5h10A2.5 2.5 0 0 1 19.5 7v6A2.5 2.5 0 0 1 17 15.5h-6l-4 3.5V15.5H7A2.5 2.5 0 0 1 4.5 13v-6Z" />
        <circle cx="9" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="12" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="15" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      </>
    ),
    title: "카카오톡 · 텔레그램 챗봇 개발",
    description:
      "상담, 주문 접수, 예약 알림까지 — 채널에 맞춘 시나리오로 자동응대 챗봇을 처음부터 설계하고 만듭니다.",
  },
  {
    icon: (
      <>
        <path d="M4.5 7A2.5 2.5 0 0 1 7 4.5h10A2.5 2.5 0 0 1 19.5 7v6A2.5 2.5 0 0 1 17 15.5h-6l-4 3.5V15.5H7A2.5 2.5 0 0 1 4.5 13v-6Z" />
        <circle cx="17.5" cy="5" r="2.3" fill="var(--color-accent)" stroke="none" />
      </>
    ),
    title: "실시간 채팅 상담",
    description: "화면 우측 상단 '프로젝트 문의' 버튼이 바로 그 결과물이에요. 직접 눌러서 확인해 보세요.",
  },
  {
    icon: (
      <>
        <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8" />
        <path d="M20 4v4h-4" />
        <path d="M20 12a8 8 0 0 1-13.7 5.7L4 16" />
        <path d="M4 20v-4h4" />
      </>
    ),
    title: "업무 자동화 스크립트",
    description: "반복되는 수작업, 데이터 정리, 문서 처리를 프로그램이 대신하게 만듭니다.",
  },
  {
    icon: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="4" rx="1.5" />
        <rect x="13" y="10" width="7" height="10" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
      </>
    ),
    title: "관리자 대시보드 & 자동 장부",
    description: "이 사이트의 매출 캘린더·장부도 저희가 직접 만든 관리자 도구예요.",
  },
  {
    icon: (
      <>
        <path d="M9 15 15 9" />
        <path d="M10.5 5.5 13 3a3.2 3.2 0 0 1 4.5 4.5l-2.5 2.5" />
        <path d="M13.5 18.5 11 21a3.2 3.2 0 0 1-4.5-4.5l2.5-2.5" />
      </>
    ),
    title: "외부 API · 웹훅 연동",
    description: "여러 서비스와 시스템을 하나로 연결해 흩어진 업무를 자동으로 이어줍니다.",
  },
];

export default async function HomePage() {
  const [portfolioItems, reviews] = await Promise.all([
    prisma.portfolioItem.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
    prisma.review.findMany({
      where: { publishedAt: { not: null } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink pt-28 pb-24 text-paper md:pt-36 md:pb-32">
        {/* 장식용 액센트 — 브랜드명(OverCook)과 헤드라인("끓어오르는")에 맞춘 픽셀
            냄비 마스코트, 그 옆의 김(스팀) 방울만 남기고 무정형 블롭은 뺐습니다. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* 브랜드 마크(둥근 O + 거품)를 히어로 양옆에 옅게 띄워 브랜드를
              은은하게 각인시킵니다 — 마크 자체에 이미 거품이 있어 추가 장식은
              두지 않습니다. 어두운 배경이라 블루를 살짝 더 올려서 티 나게 합니다. */}
          <div className="absolute left-[4%] top-[10%] animate-float text-accent/[0.22] md:left-[8%]">
            <BrandMark className="h-24 w-24 md:h-32 md:w-32" />
          </div>
          {/* 오른쪽은 왼쪽과 똑같이 움직이면 부자연스러워서 애니메이션 시작 지점을
              다르게(-1.7s) 주고, 서로 마주보게 좌우로 뒤집었습니다. */}
          <div
            className="absolute top-[16%] right-[5%] animate-float text-accent/[0.16] md:right-[9%]"
            style={{ animationDelay: "-1.7s" }}
          >
            <BrandMark className="h-16 w-16 -scale-x-100 md:h-20 md:w-20" />
          </div>
        </div>

        <Container className="text-center">
          <Reveal>
            <h1 className="mx-auto max-w-2xl font-display text-4xl leading-[1.1] tracking-tight text-balance md:text-6xl">
              설익은 채로
              <br />
              내보내지 않습니다.
            </h1>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-7 max-w-lg text-lg leading-relaxed text-paper/70 md:text-xl">
              OverCook은 기획부터 출시, 그 이후까지 — 아이디어가 완전히
              완성될 때까지 함께하는 소프트웨어 개발 파트너입니다.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <OpenChatButton>프로젝트 문의하기</OpenChatButton>
              <Link
                href="/services"
                className="text-base font-medium text-accent transition-opacity hover:opacity-70"
              >
                서비스 살펴보기 &rarr;
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.22}>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-paper/70">
              <IconCheck className="h-4 w-4 shrink-0 text-accent" />
              40개 이상의 프로젝트를 완료하고, 98%가 다시 찾아주셨어요.
            </div>
          </Reveal>

          {/* 실제로 존재하는 기능(실시간 채팅 상담)을 목업으로 보여줘서, 텍스트로만
              말하던 신뢰를 눈으로 확인시켜줍니다 — 꾸며낸 일러스트 대신 실제
              제품 화면에 가까운 형태를 택했습니다. */}
          <Reveal delay={0.3}>
            <div className="relative mx-auto mt-16 max-w-md text-left">
              <div className="rotate-[-2deg] overflow-hidden rounded-2xl bg-paper shadow-[0_4px_8px_rgba(15,23,42,0.06),0_24px_48px_-16px_rgba(15,23,42,0.22)]">
                <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <p className="text-xs font-medium text-ink-soft">프로젝트 문의</p>
                  <span className="ml-auto text-[11px] text-muted">지금 응답 가능</span>
                </div>
                <div className="space-y-3 px-5 py-5">
                  <div className="flex justify-end">
                    <div className="max-w-[78%] rounded-2xl rounded-br-md bg-paper-dim px-4 py-2.5 text-sm text-ink">
                      챗봇 자동응대, 저희 서비스에도 붙일 수 있나요?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-accent px-4 py-2.5 text-sm text-white">
                      네, 바로 견적 도와드릴게요. 어떤 상담·주문 흐름인지 알려주시겠어요?
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-3 rotate-6 rounded-full bg-paper px-3 py-1.5 text-[11px] font-semibold text-accent shadow-[0_4px_8px_rgba(15,23,42,0.06),0_24px_48px_-16px_rgba(15,23,42,0.22)] md:-right-8">
                실시간 응답
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Stats */}
      <section className="border-y border-line bg-paper-dim py-16">
        <Container>
          <div className="grid grid-cols-3 divide-x divide-line text-center">
            {STATS.map((stat) => (
              <div key={stat.label} className="px-3">
                <CountUp
                  value={stat.value}
                  suffix={stat.suffix}
                  className="font-display text-4xl tracking-tight md:text-5xl"
                />
                <p className="mt-2 text-sm text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 왜 OverCook인가 — AI 대비 차별점(다음 섹션)보다 앞서, 다른 실제 외주사·프리랜서
          대비 OverCook만의 강점을 먼저 짚습니다. 예산 맞춤 설계가 대표님이 꼽은
          가장 큰 차별점이라 hero 타일로 강조합니다. */}
      {/* 왜 OverCook인가 + AI 프로토타입과의 차별점을 한 섹션으로 통합 — 강조 카드
          하나(예산 맞춤 설계)를 어두운 잉크 톤으로 두 번째 앵커 삼고, 나머지
          차별점은 압축된 리스트+한 줄 코멘트로만 붙입니다. */}
      <section className="py-28">
        <Container>
          <h2 className="max-w-xl font-display text-3xl tracking-tight text-balance md:text-4xl">
            정해진 견적서보다, 예산을 먼저 봅니다
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
            <div className="rounded-3xl bg-ink px-8 py-10 text-paper md:px-10 md:py-12">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white">
                {WHY_US[0].icon}
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold md:text-2xl">
                {WHY_US[0].title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-paper/70 md:text-lg">
                {WHY_US[0].description}
              </p>
            </div>

            <div className="space-y-8">
              {WHY_US.slice(1).map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2.5 border-t border-line pt-6 text-sm font-medium leading-relaxed text-ink">
                <span className="mt-0.5 shrink-0 text-accent" aria-hidden>
                  &rarr;
                </span>
                결제, 보안, 트래픽까지 — 실제 운영을 버티는 구조로 설계합니다.
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 할 수 있는 것들 — /services에 이미 있는 상세 설명을 반복하지 않고,
          홈페이지에서는 태그형 미니 카드로만 훑어보고 바로 넘어가게 합니다. */}
      <section className="py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-xl font-display text-3xl tracking-tight text-balance md:text-4xl">
              빠르기만 한 외주가 아니라, 끝까지 책임지는 파트너
            </h2>
            <Link href="/services" className="text-sm font-medium text-accent hover:opacity-70">
              서비스 전체 보기 &rarr;
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CAPABILITIES.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {item.icon}
                  </svg>
                </span>
                <span className="text-sm font-semibold leading-snug">{item.title}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Portfolio preview */}
      {portfolioItems.length > 0 && (
        <section className="bg-paper-dim py-28">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-display text-3xl tracking-tight text-balance md:text-4xl">
                최근 진행한 프로젝트
              </h2>
              <Link
                href="/portfolio"
                className="text-sm font-medium text-accent hover:opacity-70"
              >
                포트폴리오 전체 보기 &rarr;
              </Link>
            </div>

            {portfolioItems.length >= 3 ? (
              <div className="mt-14">
                <Carousel>
                  {portfolioItems.map((item, i) => (
                    <div key={item.slug} className="w-[85%] shrink-0 sm:w-[360px]">
                      <PortfolioPreviewCard item={item} index={i} />
                    </div>
                  ))}
                </Carousel>
              </div>
            ) : (
              <div
                className={cn(
                  "mt-14 grid gap-6",
                  portfolioItems.length === 1 && "mx-auto max-w-sm",
                  portfolioItems.length === 2 && "mx-auto max-w-3xl md:grid-cols-2"
                )}
              >
                {portfolioItems.map((item, i) => (
                  <div key={item.slug}>
                    <PortfolioPreviewCard item={item} index={i} />
                  </div>
                ))}
              </div>
            )}
          </Container>
        </section>
      )}

      {/* 후기 미리보기 — 실시간 채팅 목업 다음으로 신뢰를 뒷받침하는 실제 증거라,
          가장 트래픽이 많은 홈페이지에서도 보이게 하고 CTA 바로 앞에 배치해서
          "믿을 만하다 → 그럼 문의해볼까"로 자연스럽게 이어지게 합니다. */}
      {reviews.length > 0 && (
        <section className="py-24">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-display text-3xl tracking-tight text-balance md:text-4xl">
                함께한 분들의 이야기
              </h2>
              <Link href="/reviews" className="text-sm font-medium text-accent hover:opacity-70">
                후기 더 보기 &rarr;
              </Link>
            </div>

            <div
              className={cn(
                "mt-14 grid gap-6",
                reviews.length === 1 && "mx-auto max-w-sm",
                reviews.length === 2 && "mx-auto max-w-3xl md:grid-cols-2",
                reviews.length >= 3 && "md:grid-cols-3"
              )}
            >
              {reviews.map((review) => (
                <div key={review.id}>
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CTA */}
      <section className="py-32">
        <Container>
          <div className="rounded-[2rem] bg-ink px-8 py-20 text-center text-paper md:px-16">
            <h2 className="mx-auto max-w-lg font-display text-3xl tracking-tight text-balance md:text-4xl">
              다음 프로젝트, OverCook과 함께 시작해볼까요?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-paper/60">
              채팅 한 번이면 충분합니다. 담당자가 바로 답변드려요.
            </p>
            <div className="mt-9 flex justify-center">
              <OpenChatButton>프로젝트 문의하기</OpenChatButton>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function PortfolioPreviewCard({ item, index }: { item: PortfolioItem; index: number }) {
  return (
    <Link href={`/portfolio/${item.slug}`} className="group block">
      {item.images[0] ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
          <Image
            src={item.images[0]}
            alt={item.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <PlaceholderArt index={index} className="aspect-[4/3]" />
      )}
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-accent">
        {item.category}
      </p>
      <h3 className="mt-1 font-display text-lg transition-opacity group-hover:opacity-70">
        {item.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{item.summary}</p>
      {(item.duration || item.cost) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.duration && (
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
              기간 {item.duration}
            </span>
          )}
          {item.cost && (
            <span className="rounded-full bg-paper-dim px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
              비용 {item.cost}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
