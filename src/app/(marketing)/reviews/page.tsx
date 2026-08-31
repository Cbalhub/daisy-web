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
    "챗봇, 자동화 시스템, 무인 판매 시스템을 MOVD와 함께 만든 고객들의 실제 후기. 가격·기능·보안·유지보수에 대한 솔직한 평가를 확인해 보세요.",
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
          <h1 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
            함께한 분들의 이야기
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            MOVD와 프로젝트를 진행한 고객들의 실제 후기입니다.
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          {REVIEWS.length === 0 ? (
            <div className="text-center">
              <Mark variant="mono" className="mx-auto h-12 w-12 text-accent/60" />
              <p className="mt-4 text-sm text-muted">곧 새로운 후기로 찾아뵙겠습니다.</p>
            </div>
          ) : (
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {REVIEWS.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}

          <div className="mt-16">
            <CtaBand
              title="정확한 견적이 궁금하신가요?"
              description="프로젝트 범위에 따라 가격이 달라지기 때문에, 채팅으로 상황을 알려주시면 정확한 견적을 바로 안내해 드려요."
              cta="지금 상담하기"
            />
          </div>
        </Container>
      </section>
    </>
  );
}
