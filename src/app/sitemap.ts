import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL as BASE_URL } from "@/lib/site";

const STATIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/portfolio", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/reviews", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/refund-policy", priority: 0.2, changeFrequency: "yearly" as const },
];

// 로그인/결제/관리자 페이지(계정, 채팅, 결제 링크, /admin)는 개인화된 비공개
// 콘텐츠라 검색엔진에 노출할 필요가 없으므로 사이트맵에 포함하지 않습니다.
// /contact도 실제 콘텐츠 없이 로그인 여부에 따라 /chat 또는 로그인 페이지로
// 리다이렉트만 하므로 제외합니다 — 크롤러에게 리다이렉트 URL을 색인하라고
// 안내하는 건 크롤 예산 낭비이자 혼란스러운 신호입니다.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [portfolioItems, lastReview] = await Promise.all([
    prisma.portfolioItem.findMany({
      where: { publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.review.findFirst({
      where: { publishedAt: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  // 콘텐츠가 실제로 바뀐 시점을 lastModified 로 씁니다 — 매번 "지금"으로 찍으면
  // 크롤러가 신호를 신뢰하지 않게 됩니다.
  const latestPortfolio =
    portfolioItems.reduce<Date | null>(
      (max, i) => (!max || i.updatedAt > max ? i.updatedAt : max),
      null
    ) ?? new Date();
  const lastModByPath: Record<string, Date> = {
    "/": latestPortfolio,
    "/portfolio": latestPortfolio,
    "/reviews": lastReview?.updatedAt ?? new Date(),
  };

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${BASE_URL}${route.path}`,
      lastModified: lastModByPath[route.path] ?? new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...portfolioItems.map((item) => ({
      url: `${BASE_URL}/portfolio/${item.slug}`,
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
