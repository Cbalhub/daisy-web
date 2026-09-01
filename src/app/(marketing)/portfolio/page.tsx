import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PortfolioSearch } from "@/components/marketing/PortfolioSearch";
import { Mark } from "@/components/brand/Mark";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "포트폴리오",
  description:
    "MOVD가 실제로 납품한 챗봇, 업무 자동화 툴, 관리자 대시보드, 봇 프로젝트들. 업종·기능·기간·비용까지 함께 정리했습니다.",
  alternates: { canonical: "/portfolio" },
};

// ISR — 정적으로 캐시하고 5분마다 백그라운드 재생성합니다. 관리자가 포트폴리오를
// 올리거나 고치면 revalidatePortfolio() 가 이 경로 캐시를 바로 비웁니다.
export const revalidate = 300;

export default async function PortfolioPage() {
  const items = await prisma.portfolioItem.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <section className="pt-20 pb-24 md:pt-28">
      <Container>
        <h1 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          지금까지 만든 것들
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          업무 자동화, 챗봇, 관리자 도구. 실제로 납품한 작업들입니다.
        </p>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <Mark variant="mono" className="mx-auto h-12 w-12 text-muted/50" />
            <p className="mt-4 text-sm text-muted">아직 올린 작업이 없어요.</p>
          </div>
        ) : (
          <PortfolioSearch items={items} />
        )}
      </Container>
    </section>
  );
}
