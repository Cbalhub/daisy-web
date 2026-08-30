import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PortfolioSearch } from "@/components/marketing/PortfolioSearch";
import { DaisyAsterisk } from "@/components/marketing/DaisyAsterisk";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "포트폴리오",
  description:
    "Daisy가 실제로 납품한 챗봇, 업무 자동화 툴, 관리자 대시보드, 봇 프로젝트들. 업종·기능·기간·비용까지 함께 정리했습니다.",
  alternates: { canonical: "/portfolio" },
};

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const items = await prisma.portfolioItem.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <section className="pt-20 pb-24 md:pt-28">
      <Container>
        <h1 className="max-w-2xl font-display text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
          함께 만든 프로젝트들
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          업무 자동화, 챗봇, 관리자 도구까지 — 실제로 납품한 작업의 일부입니다.
        </p>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <DaisyAsterisk variant="mono" className="mx-auto h-12 w-12 text-accent/60" />
            <p className="mt-4 text-sm text-muted">곧 새로운 프로젝트로 찾아뵙겠습니다.</p>
          </div>
        ) : (
          <PortfolioSearch items={items} />
        )}
      </Container>
    </section>
  );
}
