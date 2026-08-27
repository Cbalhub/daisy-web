import type { PortfolioItem } from "@prisma/client";
import { Container } from "@/components/ui/Container";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import {
  CheckCircle2,
  SlidersHorizontal,
  UserCheck,
  HeartHandshake,
  Eye,
  MessageSquareText,
  MessageCircle,
  Workflow,
  LayoutDashboard,
  Webhook,
} from "lucide-react";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { GrowthHero } from "@/components/marketing/GrowthHero";
import { ProcessStepper } from "@/components/marketing/ProcessStepper";
import { Carousel } from "@/components/marketing/Carousel";
import { ReviewCard } from "@/components/marketing/ReviewCard";
import { prisma } from "@/lib/prisma";
import { PROCESS_STEPS } from "@/lib/content";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// 포트폴리오는 자주 바뀌지 않으므로, 매 요청마다 새로 렌더링하는 대신
// 5분 주기로만 다시 조회해 정적 페이지에 가까운 성능을 유지합니다.
export const revalidate = 300;

// PROCESS 배지 링 색 — GrowthHero 개화 단계와 같은 순서의 꽃잎 색입니다.
const PETAL_RING_COLORS = [
  "var(--color-petal-yellow)",
  "var(--color-petal-pink)",
  "var(--color-petal-purple)",
  "var(--color-petal-blue)",
  "var(--color-petal-mint)",
  "var(--color-petal-orange)",
];

// Stats 섹션에서 구분선 대신 쓰는 작은 데이지 한 송이 — 화단처럼 한 줄로 섰을 때
// 보이도록 줄기 없이 살짝 짧게, 꽃잎 5장 + 중심 점만 단순하게 그렸습니다.
function MiniDaisy({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="mx-auto h-6 w-6">
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="12"
          cy="6.2"
          rx="2.6"
          ry="4.2"
          fill={color}
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="2.4" className="fill-ink" />
    </svg>
  );
}

const STATS = [
  { value: 40, suffix: "+", label: "완료 프로젝트" },
  { value: 98, suffix: "%", label: "재계약 · 추천율" },
  { value: 24, suffix: "h", label: "평균 문의 응답" },
];

// 배열의 첫 항목(예산 맞춤 설계)이 대표님이 꼽은 가장 큰 차별점이라, 순서
// 자체가 의미를 가집니다.
const WHY_US = [
  {
    icon: SlidersHorizontal,
    title: "예산에 맞춰 설계합니다",
    description:
      "정해진 견적을 먼저 들이미는 대신, 예산을 먼저 여쭤보고 그 안에서 가장 효과적인 범위를 제안해요.",
  },
  {
    icon: UserCheck,
    title: "대표가 처음부터 끝까지",
    description: "상담부터 기획, 개발, 배포까지 담당자가 바뀌지 않고 대표가 직접 진행해요.",
  },
  {
    icon: HeartHandshake,
    title: "출시 후에도 책임집니다",
    description: "납품하고 끝이 아니라, 버그·장애 대응까지 계속 함께해요.",
  },
  {
    icon: Eye,
    title: "진행 상황을 투명하게",
    description: "채팅과 마이페이지에서 지금 어느 단계인지 바로 확인할 수 있어요.",
  },
];

const CAPABILITIES = [
  {
    icon: MessageSquareText,
    title: "카카오톡 · 텔레그램 챗봇 개발",
    description:
      "상담, 주문 접수, 예약 알림까지 — 채널에 맞춘 시나리오로 자동응대 챗봇을 처음부터 설계하고 만듭니다.",
  },
  {
    icon: MessageCircle,
    title: "실시간 채팅 상담",
    description: "화면 우측 상단 '프로젝트 문의' 버튼이 바로 그 결과물이에요. 직접 눌러서 확인해 보세요.",
  },
  {
    icon: Workflow,
    title: "업무 자동화 스크립트",
    description: "반복되는 수작업, 데이터 정리, 문서 처리를 프로그램이 대신하게 만듭니다.",
  },
  {
    icon: LayoutDashboard,
    title: "관리자 대시보드 & 자동 장부",
    description: "이 사이트의 매출 캘린더·장부도 저희가 직접 만든 관리자 도구예요.",
  },
  {
    icon: Webhook,
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
      {/* 히어로 — 씨앗이 이 섹션 스크롤 구간(180vh) 동안 화면에 고정된 채로
          자라서 개화하고, 다 자란 뒤에야 고정이 풀리며 아래 내용으로 넘어갑니다. */}
      <GrowthHero
        eyebrow="소프트웨어 개발 외주 · 챗봇 · 업무 자동화"
        headline={
          <>
            돈 받고 만드는 이상,
            <br />
            제대로 만듭니다
          </>
        }
      />

      <section className="pt-10 pb-16">
        <Container className="text-center">
          <Reveal delay={0.06}>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              Daisy는{" "}
              <span className="relative inline-block font-semibold text-ink">
                기획부터 출시
                <svg
                  aria-hidden
                  viewBox="0 0 200 16"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-accent"
                >
                  <path
                    d="M2 10 C 40 4, 80 13, 120 7 S 175 4, 198 9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              , 그 이후까지 — 아이디어가{" "}
              <span className="relative inline-block font-semibold text-ink">
                완전히 완성될 때까지
                <svg
                  aria-hidden
                  viewBox="0 0 220 16"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-accent"
                >
                  <path
                    d="M2 10 C 45 4, 90 13, 130 7 S 195 4, 218 9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              함께하는 소프트웨어 개발 파트너입니다.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-6">
              <OpenChatButton className="bg-accent hover:opacity-90">프로젝트 문의하기</OpenChatButton>
              <Link
                href="/services"
                className="text-base font-semibold text-ink transition-opacity hover:opacity-70"
              >
                서비스 살펴보기 &rarr;
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-ink-soft">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
              40개 이상의 프로젝트를 완료하고, 98%가 다시 찾아주셨어요.
            </div>
          </Reveal>

          {/* 실제로 존재하는 기능(실시간 채팅 상담)을 목업으로 보여줘서
              텍스트로만 말하던 신뢰를 눈으로 확인시켜줍니다. */}
          <Reveal delay={0.28}>
            <div className="relative mx-auto mt-14 max-w-md text-left">
              <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_2px_4px_rgba(23,23,23,0.04),0_32px_64px_-24px_rgba(23,23,23,0.18)]">
                <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  <p className="text-sm font-semibold text-ink">프로젝트 문의</p>
                  <span className="ml-auto text-xs text-muted">지금 응답 가능</span>
                </div>
                <div className="space-y-3.5 px-5 py-6">
                  <div className="flex justify-end">
                    <div className="max-w-[78%] rounded-xl rounded-br-sm bg-paper-dim px-4 py-2.5 text-sm text-ink">
                      챗봇 자동응대, 저희 서비스에도 붙일 수 있나요?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[78%] rounded-xl rounded-bl-sm bg-accent px-4 py-2.5 text-sm text-white">
                      네, 바로 견적 도와드릴게요. 어떤 상담·주문 흐름인지 알려주시겠어요?
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-3 rotate-6 rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_4px_8px_rgba(23,23,23,0.16)]">
                실시간 응답
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* 브랜드 스토리 — 씨앗→화분→물→꽃 은유. 일러스트는 위 히어로에서 이미
          보여줬으니 여기서는 카피만 짧은 인용구 형태로 반복해 각인시킵니다. */}
      <section className="py-20">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight text-balance md:text-3xl">
                아이디어라는 씨앗이, 완성된 제품이라는 꽃이 되기까지
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted">
                당신의 비즈니스 아이디어(씨앗)를 탄탄한 아키텍처(화분)에 담아, 기술이라는
                물을 꾸준히 주며 — 완성된 소프트웨어라는 꽃으로 키워냅니다.
              </p>
              <ul className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-2">
                {["아이디어", "전략 설계", "디자인 · 개발", "기능 구현", "완성된 제품"].map(
                  (label) => (
                    <li
                      key={label}
                      className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink-soft"
                    >
                      {label}
                    </li>
                  )
                )}
              </ul>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Stats — 구분선 대신 작은 데이지가 한 줄로 선 화단 느낌으로. 파란
          배경을 통째로 칠하지 않는 것도(DAISY는 강조색을 화면 전체에 까는
          브랜드가 아님) 그대로 유지합니다. */}
      <section className="py-14">
        <Container>
          <div className="relative grid grid-cols-3 text-center">
            <span className="absolute inset-x-4 bottom-9 h-px bg-line" aria-hidden />
            {STATS.map((stat, i) => (
              <div key={stat.label} className="relative px-2">
                <MiniDaisy color={PETAL_RING_COLORS[i % PETAL_RING_COLORS.length]} />
                <CountUp
                  value={stat.value}
                  suffix={stat.suffix}
                  className="mt-2 block font-display text-3xl font-bold tracking-tight md:text-5xl"
                />
                <p className="mt-1.5 text-xs font-medium text-muted md:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 왜 Daisy인가 — 카드 4개를 똑같이 반복하는 대신, 큰 번호 + 타이포그래피
          중심의 에디토리얼 리스트로 바꿨습니다(DAISY 브리프의 "카드보다 타이포"
          원칙). 배경 패널·둥근 배지도 걷어내 Ink+Paper 위주 톤에 맞췄습니다. */}
      <section className="py-24">
        <Container>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Why Daisy
          </p>
          <h2 className="mx-auto mt-3 max-w-xl text-center font-display text-2xl font-bold tracking-tight text-balance md:text-3xl">
            정해진 견적서보다, 예산을 먼저 봅니다
          </h2>

          <div className="mx-auto mt-14 max-w-3xl divide-y divide-line border-t border-line">
            {WHY_US.map((item, i) => (
              <div key={item.title} className="flex items-start gap-6 py-8 md:gap-10">
                <span className="w-12 shrink-0 font-display text-4xl font-bold tracking-tight text-line md:w-16 md:text-5xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} />
                    <h3 className="text-base font-bold leading-snug md:text-lg">{item.title}</h3>
                  </div>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 진행 과정 — 균일한 카드 대신, 씨앗이 자라는 성장 경로처럼 점을 실선으로
          잇는 스텝퍼로 바꿨습니다. 점 색은 화단·히어로에서 쓴 것과 같은 꽃잎
          색 순서라, 문의부터 유지보수까지가 하나의 성장 과정처럼 읽힙니다. */}
      <section className="py-24">
        <Container>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Process
          </p>
          <h2 className="mx-auto mt-3 max-w-xl text-center font-display text-2xl font-bold tracking-tight text-balance md:text-3xl">
            문의부터 유지보수까지, 여섯 단계로
          </h2>

          <ProcessStepper steps={PROCESS_STEPS} />
        </Container>
      </section>

      {/* 할 수 있는 것들 — 그림자 있는 카드+파란 아이콘 배지는 위 WHY_US/PROCESS를
          다시 칠한 뒤로 그대로 남아있던 옛날 스타일이라 테마가 겹겹이 어긋나
          보였습니다. 같은 언어(가운데 정렬 eyebrow, 헤어라인, 꽃잎 색 아이콘
          배지)로 맞췄습니다. 큰 카드 2개+작은 카드 구성(벤토)만 유지합니다. */}
      <section className="py-24">
        <Container>
          <p className="text-center text-xs font-semibold tracking-[0.05em] text-accent">
            할 수 있는 일
          </p>
          <h2 className="mx-auto mt-3 max-w-xl text-center font-display text-2xl font-bold tracking-tight text-balance md:text-3xl">
            빠르기만 한 외주가 아니라, 끝까지 책임지는 파트너
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CAPABILITIES.map((item, i) => {
              const isFeatured = i === 0 || i === 3;
              return (
                <div
                  key={item.title}
                  className={cn(
                    "border border-line bg-paper",
                    isFeatured
                      ? "sm:col-span-2 flex items-center gap-5 px-6 py-7"
                      : "flex flex-col gap-3 px-5 py-6"
                  )}
                >
                  <span
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full text-ink",
                      isFeatured ? "h-14 w-14" : "h-10 w-10"
                    )}
                    style={{ background: PETAL_RING_COLORS[i % PETAL_RING_COLORS.length] }}
                  >
                    <item.icon className={isFeatured ? "h-7 w-7" : "h-5 w-5"} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className={cn("font-bold leading-snug", isFeatured ? "text-base" : "text-sm")}>
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Link href="/services" className="text-sm font-semibold text-accent hover:opacity-70">
              서비스 전체 보기 &rarr;
            </Link>
          </div>
        </Container>
      </section>

      {/* Portfolio preview */}
      {portfolioItems.length > 0 && (
        <section className="bg-paper-dim py-24">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.05em] text-accent">포트폴리오</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance md:text-4xl">
                  최근 진행한 프로젝트
                </h2>
              </div>
              <Link
                href="/portfolio"
                className="text-sm font-semibold text-accent hover:opacity-70"
              >
                포트폴리오 전체 보기 &rarr;
              </Link>
            </div>

            {portfolioItems.length >= 3 ? (
              <div className="mt-12">
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
                  "mt-12 grid gap-6",
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

      {/* 후기 미리보기 */}
      {reviews.length > 0 && (
        <section className="py-24">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.05em] text-accent">후기</p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance md:text-4xl">
                  함께한 분들의 이야기
                </h2>
              </div>
              <Link href="/reviews" className="text-sm font-semibold text-accent hover:opacity-70">
                후기 더 보기 &rarr;
              </Link>
            </div>

            <div
              className={cn(
                "mt-12 grid gap-6",
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

      {/* CTA — 검정 블록은 이 페이지 곳곳에 자리잡은 헤어라인+여백 위주 톤과
          안 맞아서(유일하게 남은 큰 단색 블록), 위쪽 헤어라인 하나로 구분만
          하는 조용한 마무리로 바꿨습니다. 액션 색은 여전히 accent 하나만. */}
      <section className="border-t border-line py-24">
        <Container>
          <div className="text-center">
            <h2 className="mx-auto max-w-lg font-display text-3xl font-bold tracking-tight text-balance md:text-4xl">
              다음 프로젝트, Daisy와 함께 시작해볼까요?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted">
              채팅 한 번이면 충분합니다. 담당자가 바로 답변드려요.
            </p>
            <div className="mt-8 flex justify-center">
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
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
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
      <p className="mt-4 text-xs font-semibold tracking-[0.05em] text-accent">
        {item.category}
      </p>
      <h3 className="mt-1 font-display text-base font-bold transition-opacity group-hover:opacity-70">
        {item.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{item.summary}</p>
      {(item.duration || item.cost) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.duration && (
            <span className="rounded-md bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">
              기간 {item.duration}
            </span>
          )}
          {item.cost && (
            <span className="rounded-md bg-paper-dim px-2.5 py-1 text-[11px] font-bold text-ink-soft">
              비용 {item.cost}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
