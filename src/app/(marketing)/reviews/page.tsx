import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Carousel } from "@/components/marketing/Carousel";
import { DaisyAsterisk } from "@/components/marketing/DaisyAsterisk";
import { ReviewCard } from "@/components/marketing/ReviewCard";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { jsonLdScript } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "고객 후기",
  description: "Daisy와 함께한 고객들의 실제 후기입니다.",
  alternates: { canonical: "/reviews" },
};

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const REVIEWS = await prisma.review.findMany({
    where: { publishedAt: { not: null } },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  // 실제로 평점을 받은 후기만 별점 구조화데이터에 반영합니다 — 평점을 안 남긴
  // 후기까지 평균에 끼워 넣으면 지어낸 숫자나 마찬가지라, 있는 것만 계산합니다.
  const rated = REVIEWS.filter(
    (r): r is typeof r & { rating: number } => r.rating != null
  );
  const reviewsJsonLd =
    rated.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          name: "Daisy",
          url: "https://overcook.kr",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: (rated.reduce((sum, r) => sum + r.rating, 0) / rated.length).toFixed(1),
            reviewCount: rated.length,
          },
          review: rated.map((r) => ({
            "@type": "Review",
            author: { "@type": "Organization", name: r.company },
            reviewBody: r.quote,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : null;

  return (
    <>
      {reviewsJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(reviewsJsonLd) }}
        />
      )}
      <section className="pt-20 pb-16 md:pt-28">
        <Container>
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Reviews
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              함께한 분들의 이야기
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
              Daisy와 프로젝트를 진행한 고객들의 실제 후기입니다.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          {REVIEWS.length === 0 ? (
            <div className="text-center">
              <DaisyAsterisk variant="mono" className="mx-auto h-14 w-14 text-accent/70" />
              <p className="mt-4 text-sm text-muted">곧 새로운 후기로 찾아뵙겠습니다.</p>
            </div>
          ) : REVIEWS.length >= 3 ? (
            <Carousel>
              {REVIEWS.map((review) => (
                <RevealItem key={review.id} className="w-[85%] shrink-0 sm:w-[340px]">
                  <ReviewCard review={review} />
                </RevealItem>
              ))}
            </Carousel>
          ) : (
            <RevealGroup
              className={cn(
                "grid gap-6",
                REVIEWS.length === 1 ? "mx-auto max-w-sm" : "mx-auto max-w-3xl md:grid-cols-2"
              )}
            >
              {REVIEWS.map((review) => (
                <RevealItem key={review.id}>
                  <ReviewCard review={review} />
                </RevealItem>
              ))}
            </RevealGroup>
          )}

          <Reveal delay={0.1}>
            <div className="mt-14 rounded-3xl bg-paper-dim px-8 py-14 text-center">
              <h2 className="font-display text-2xl font-semibold">
                정확한 견적이 궁금하신가요?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                프로젝트 범위에 따라 가격이 달라지기 때문에, 채팅으로 상황을
                알려주시면 정확한 견적을 바로 안내해 드려요.
              </p>
              <div className="mt-7 flex justify-center">
                <OpenChatButton>지금 상담하기</OpenChatButton>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
