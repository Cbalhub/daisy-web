import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { PortfolioSearch } from "@/components/marketing/PortfolioSearch";
import { BrandMark } from "@/components/marketing/BrandMark";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "포트폴리오",
  description: "Daisy가 함께 만든 프로젝트들을 소개합니다.",
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
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Work
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            함께 만든 프로젝트들
          </h1>
        </Reveal>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <BrandMark className="mx-auto h-14 w-14 text-accent/70" />
            <p className="mt-4 text-sm text-muted">곧 새로운 프로젝트로 찾아뵙겠습니다.</p>
          </div>
        ) : (
          <PortfolioSearch items={items} />
        )}
      </Container>
    </section>
  );
}
