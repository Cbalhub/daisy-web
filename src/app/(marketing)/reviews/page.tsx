import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Mark } from "@/components/brand/Mark";
import { ReviewCard } from "@/components/marketing/ReviewCard";
import { CtaBand } from "@/components/marketing/CtaBand";
import { prisma } from "@/lib/prisma";
import { jsonLdScript } from "@/lib/json-ld";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "고객 후기",
  description:
    "MOVD에 챗봇, 자동화, 무인 판매 시스템을 맡긴 고객들이 남긴 후기. 가격·기능·보안·유지보수에 대한 평가.",
  alternates: { canonical: "/reviews" },
};

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const REVIEWS = await prisma.review.findMany({
    where: { publishedAt: { not: null } },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  const rated = REVIEWS.filter(
    (r): r is typeof r & { rating: number } => r.rating != null
  );
  const reviewsJsonLd =
    rated.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          name: "MOVD",
          "@id": `${absoluteUrl("/")}#org`,
          url: absoluteUrl("/"),
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
          <h1 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            받은 후기
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            MOVD에 작업을 맡겨본 분들이 남긴 후기입니다.
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          {REVIEWS.length === 0 ? (
            <div className="text-center">
              <Mark variant="mono" className="mx-auto h-12 w-12 text-muted/50" />
              <p className="mt-4 text-sm text-muted">아직 후기가 없어요.</p>
            </div>
          ) : (
            // 후기 길이가 제각각이라 그리드보다 컬럼 흐름(마조너리 느낌)이 덜 비어 보입니다.
            <div className="gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
              {REVIEWS.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          <div className="mt-16">
            <CtaBand
              title="견적 궁금하세요?"
              description="범위에 따라 가격이 달라져서요. 채팅으로 상황 알려 주시면 견적 바로 드립니다."
              cta="채팅으로 물어보기"
            />
          </div>
        </Container>
      </section>
    </>
  );
}
