import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { prisma } from "@/lib/prisma";
import { jsonLdScript } from "@/lib/json-ld";

// 본문을 "## 섹션명" 기준으로 나눠 헤딩+문단+목록으로 구조화합니다. 관리자가
// "## 설계", "## 작업 방식", "## 품목" 처럼 적으면 그대로 소제목이 되고,
// "- 항목" 줄은 불릿 목록으로, 나머지는 문단으로 렌더링됩니다. 기존처럼
// 소제목 없이 쓴 본문은 그냥 하나의 문단으로 자연스럽게 나옵니다.
type BodyBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function parseBody(body: string): BodyBlock[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: BodyBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join("\n") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ type: "list", items: list });
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2).trim());
    } else if (line === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await prisma.portfolioItem.findUnique({ where: { slug } });
  if (!item) return {};
  return {
    title: item.title,
    description: item.summary,
    alternates: { canonical: `/portfolio/${item.slug}` },
    openGraph: item.images[0]
      ? { title: item.title, description: item.summary, images: [item.images[0]] }
      : undefined,
  };
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await prisma.portfolioItem.findUnique({ where: { slug } });
  if (!item || !item.publishedAt) notFound();

  const related = await prisma.portfolioItem.findMany({
    where: { publishedAt: { not: null }, slug: { not: slug } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://overcook.kr" },
      { "@type": "ListItem", position: 2, name: "포트폴리오", item: "https://overcook.kr/portfolio" },
      { "@type": "ListItem", position: 3, name: item.title, item: `https://overcook.kr/portfolio/${item.slug}` },
    ],
  };

  return (
    <section className="pt-20 pb-24 md:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />
      <Container>
        <nav aria-label="이동 경로" className="mb-6 flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="transition-colors hover:text-accent">
            홈
          </Link>
          <span aria-hidden>/</span>
          <Link href="/portfolio" className="transition-colors hover:text-accent">
            포트폴리오
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-ink-soft">{item.title}</span>
        </nav>

        {/* 히어로 이미지 — 케이스 스터디 느낌을 살리되, 다른 페이지들과 같은 컨테이너
            폭 안에 둬서 갑자기 화면 끝까지 밀려나가지 않게 합니다. */}
        <Reveal>
          {item.images[0] ? (
            <div className="relative aspect-[16/9] max-h-[420px] w-full overflow-hidden rounded-xl">
              <Image
                src={item.images[0]}
                alt={item.title}
                fill
                sizes="(min-width: 768px) 1152px, 100vw"
                priority
                className="object-cover"
              />
            </div>
          ) : (
            <PlaceholderArt index={0} className="aspect-[16/9] max-h-[420px] w-full" />
          )}
        </Reveal>

        <Reveal delay={0.06}>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            {item.category} · {item.publishedAt.getFullYear()}
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            {item.title}
          </h1>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{item.summary}</p>
        </Reveal>

        {(item.industry || item.duration || item.cost || item.features.length > 0) && (
          <Reveal delay={0.18}>
            <div className="mt-10 grid grid-cols-2 gap-6 rounded-2xl bg-paper px-7 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)] sm:grid-cols-4">
              {item.industry && (
                <div>
                  <p className="text-xs font-medium text-muted">업종</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{item.industry}</p>
                </div>
              )}
              {item.features.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted">기능</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{item.features.join(" · ")}</p>
                </div>
              )}
              {item.duration && (
                <div>
                  <p className="text-xs font-medium text-muted">기간</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{item.duration}</p>
                </div>
              )}
              {item.cost && (
                <div>
                  <p className="text-xs font-medium text-muted">비용</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{item.cost}</p>
                </div>
              )}
            </div>
          </Reveal>
        )}

        {item.body && (
          <Reveal delay={0.22}>
            <div className="mt-10 max-w-2xl space-y-4">
              {parseBody(item.body).map((block, i) => {
                if (block.type === "heading") {
                  return (
                    <h2 key={i} className="pt-2 font-display text-xl font-semibold text-ink">
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === "list") {
                  return (
                    <ul key={i} className="space-y-2">
                      {block.items.map((entry, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-base leading-[1.8] text-ink-soft">
                          <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-accent" />
                          {entry}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className="text-base leading-[1.8] whitespace-pre-line text-ink-soft">
                    {block.text}
                  </p>
                );
              })}
            </div>
          </Reveal>
        )}

        {item.images.length > 1 && (
          <div className="mt-12 space-y-6">
            {item.images.slice(1).map((src, i) => (
              <Reveal key={src} delay={0.04 * i}>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                  <Image
                    src={src}
                    alt={`${item.title} 예시 사진 ${i + 2}`}
                    fill
                    sizes="(min-width: 768px) 900px, 100vw"
                    className="object-cover"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {item.tags.length > 0 && (
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Reveal>
        )}

        {related.length > 0 && (
          <div className="mt-20">
            <Reveal>
              <h2 className="font-display text-xl font-semibold tracking-tight">관련 프로젝트</h2>
            </Reveal>
            <RevealGroup
              className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              stagger={0.05}
            >
              {related.map((r, i) => (
                <RevealItem key={r.slug}>
                  <Link href={`/portfolio/${r.slug}`} className="group block">
                    {r.images[0] ? (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                        <Image
                          src={r.images[0]}
                          alt={r.title}
                          fill
                          sizes="(min-width: 768px) 33vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                    ) : (
                      <PlaceholderArt index={i} className="aspect-[4/3]" />
                    )}
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-accent">
                      {r.category}
                    </p>
                    <h3 className="mt-1 font-display text-base font-semibold transition-colors group-hover:text-accent">
                      {r.title}
                    </h3>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        )}

        <Reveal delay={0.1}>
          <div className="mt-16 rounded-3xl bg-paper-dim px-8 py-12 text-center">
            <h2 className="font-display text-2xl font-semibold">
              비슷한 프로젝트를 계획 중이신가요?
            </h2>
            <div className="mt-6 flex justify-center">
              <OpenChatButton>프로젝트 문의하기</OpenChatButton>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
