import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ProjectMockup, ProjectMockupGallery } from "@/components/marketing/ProjectMockup";
import { CtaBand } from "@/components/marketing/CtaBand";
import { prisma } from "@/lib/prisma";
import { jsonLdScript, breadcrumbJsonLd } from "@/lib/json-ld";
import { absoluteUrl, SITE_URL, SITE_NAME } from "@/lib/site";

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

// ISR — 게시된 슬러그는 빌드 때 정적 생성하고, 이후 5분마다 백그라운드 재생성.
// 관리자가 케이스 스터디를 고치면 revalidatePortfolio() 가 즉시 캐시를 비웁니다.
// 빌드 이후 새로 게시된 슬러그도 첫 요청에 렌더 후 캐시됩니다(dynamicParams 기본값).
export const revalidate = 300;

export async function generateStaticParams() {
  const items = await prisma.portfolioItem.findMany({
    where: { publishedAt: { not: null } },
    select: { slug: true },
  });
  return items.map((i) => ({ slug: i.slug }));
}

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
    keywords: item.tags.length > 0 ? item.tags : undefined,
    openGraph: {
      type: "article",
      title: item.title,
      description: item.summary,
      url: `/portfolio/${item.slug}`,
      publishedTime: item.publishedAt?.toISOString(),
      modifiedTime: item.updatedAt.toISOString(),
      images: item.images[0] ? [item.images[0]] : undefined,
    },
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

  // 관련 프로젝트: 같은 카테고리 + 공유 태그 수로 점수를 매겨 상위 3개를 고릅니다.
  // 아무것도 안 겹치면 최신순으로 채워집니다. 게시된 항목 수가 많지 않아 전체를
  // 가져와 메모리에서 정렬합니다.
  const relatedPool = await prisma.portfolioItem.findMany({
    where: { publishedAt: { not: null }, slug: { not: slug } },
    orderBy: { publishedAt: "desc" },
  });
  const related = relatedPool
    .map((r) => ({
      item: r,
      score:
        (r.category === item.category ? 2 : 0) +
        r.tags.filter((t) => item.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.item);

  // 케이스 스터디 = 우리가 만든 결과물에 대한 글. CreativeWork 로 표현하고
  // 게시·수정일, 제작자(MOVD), 업종·태그를 함께 실어 검색엔진이 "누가, 언제,
  // 무엇을 만들었는지" 이해하도록 합니다. 이동 경로도 같은 스크립트에 함께.
  const pageUrl = absoluteUrl(`/portfolio/${item.slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbJsonLd([
        ["홈", absoluteUrl("/")],
        ["포트폴리오", absoluteUrl("/portfolio")],
        [item.title, pageUrl],
      ]),
      {
        "@type": "CreativeWork",
        "@id": `${pageUrl}#work`,
        name: item.title,
        headline: item.title,
        description: item.summary,
        url: pageUrl,
        inLanguage: "ko-KR",
        datePublished: item.publishedAt?.toISOString(),
        dateModified: item.updatedAt.toISOString(),
        image: item.images[0] ? absoluteUrl(item.images[0]) : `${SITE_URL}/opengraph-image`,
        creator: { "@type": "Organization", name: SITE_NAME, "@id": `${SITE_URL}/#org` },
        publisher: { "@id": `${SITE_URL}/#org` },
        ...(item.industry ? { about: item.industry } : {}),
        ...(item.tags.length > 0 ? { keywords: item.tags.join(", ") } : {}),
        ...(item.category ? { genre: item.category } : {}),
      },
    ],
  };

  return (
    <section className="pt-20 pb-24 md:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
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

        {/* 케이스 스터디 인트로 — 제목·요약을 먼저 읽히고, 그 아래에 화면 목업. */}
        <p className="text-xs font-medium text-muted">
          {item.category} · {item.publishedAt.getFullYear()}
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
          {item.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{item.summary}</p>

        <div className="mt-8">
          {item.images.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto rounded-xl border border-line bg-paper-dim p-4 sm:justify-center sm:p-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {item.images.map((src) => (
                <div
                  key={src}
                  className="relative aspect-[4/3] w-[280px] shrink-0 overflow-hidden rounded-xl border border-line sm:w-[360px]"
                >
                  <Image src={src} alt={item.title} fill sizes="360px" priority className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <ProjectMockupGallery item={item} />
          )}
        </div>

        {(item.industry || item.duration || item.cost || item.features.length > 0) && (
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-6 sm:grid-cols-4">
            {item.industry && (
              <div>
                <p className="text-xs text-muted">업종</p>
                <p className="mt-1 text-sm font-semibold text-ink">{item.industry}</p>
              </div>
            )}
            {item.features.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-muted">기능</p>
                <p className="mt-1 text-sm font-semibold text-ink">{item.features.join(" · ")}</p>
              </div>
            )}
            {item.duration && (
              <div>
                <p className="text-xs text-muted">기간</p>
                <p className="mt-1 text-sm font-semibold text-ink">{item.duration}</p>
              </div>
            )}
            {item.cost && (
              <div>
                <p className="text-xs text-muted">비용</p>
                <p className="mt-1 text-sm font-semibold text-ink">{item.cost}</p>
              </div>
            )}
          </div>
        )}

        {item.body && (
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
                      <li
                        key={j}
                        className="flex items-start gap-2.5 text-base leading-[1.8] text-ink-soft"
                      >
                        <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-accent" />
                        {entry}
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p
                  key={i}
                  className="text-base leading-[1.8] whitespace-pre-line text-ink-soft"
                >
                  {block.text}
                </p>
              );
            })}
          </div>
        )}

        {item.images.length > 1 && (
          <div className="mt-12 space-y-6">
            {item.images.slice(1).map((src, i) => (
              <div
                key={src}
                className="relative aspect-video w-full overflow-hidden rounded-xl border border-line"
              >
                <Image
                  src={src}
                  alt={`${item.title} 예시 사진 ${i + 2}`}
                  fill
                  sizes="(min-width: 768px) 900px, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {item.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display text-xl font-extrabold tracking-tight">관련 프로젝트</h2>
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/portfolio/${r.slug}`}
                  className="group block transition-transform duration-300 ease-out hover:-translate-y-1"
                >
                  {r.images[0] ? (
                    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line shadow-[var(--shadow-e1)] transition-shadow duration-300 group-hover:shadow-[var(--shadow-e2)]">
                      <Image
                        src={r.images[0]}
                        alt={r.title}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : (
                    <ProjectMockup item={r} className="aspect-[16/10]" />
                  )}
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-[15px] font-semibold transition-colors group-hover:text-accent">
                      {r.title}
                    </h3>
                    <span className="shrink-0 text-xs text-muted">{r.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16">
          <CtaBand title="비슷한 거 만들고 싶으세요?" />
        </div>
      </Container>
    </section>
  );
}
