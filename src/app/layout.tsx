import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { AnalyticsBeacon } from "@/components/analytics/AnalyticsBeacon";
import { ToastProvider } from "@/components/ui/Toast";
import { getBusinessSettings } from "@/lib/settings";
import { jsonLdScript } from "@/lib/json-ld";
import { prisma } from "@/lib/prisma";
import { SITE_URL, SITE_NAME } from "@/lib/site";

// 사이트 전체를 Pretendard 하나로 통일합니다 — 제목/본문/숫자 모두. 위계는
// 굵기(400·600·800)와 크기·자간으로만 만듭니다. (별도 디스플레이/모노 서체 없음)
const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

const SITE_TITLE = "Daisy — 제대로 만드는 소프트웨어 개발 파트너";
const SITE_DESCRIPTION =
  "카카오톡·텔레그램 챗봇, 업무 자동화 프로그램, 관리자 대시보드를 기획부터 운영까지. 예산에 맞춰 설계하고 대표가 직접 만드는 소프트웨어 개발 외주 스튜디오 Daisy입니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Daisy",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // 네이버 서치어드바이저 / 구글 서치 콘솔에서 사이트 소유를 확인할 때 발급되는
  // 코드입니다. 아직 등록 전이라 값이 없으면(.env에 없으면) 태그 자체가 빠져서
  // 빈 값이 노출되지 않습니다 — 등록 후 코드를 .env에 넣기만 하면 바로 반영돼요.
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      ? { other: { "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION } }
      : {}),
  },
};

// 대표님이 관리자 설정에서 주소·연락처를 채워 넣으면, 코드 수정 없이도
// 구조화 데이터가 그 값을 그대로 반영하도록 DB에서 읽어옵니다. 아직
// 비워둔 값은 검색엔진에 빈 문자열로 노출하지 않도록 필드 자체를 뺍니다.
// 이 조회를 RootLayout 본체에서 직접 await하면 사이트 전체(마케팅·계정·
// 채팅·결제·관리자 페이지 전부)가 이 DB 호출이 끝날 때까지 아무것도 못
// 그리게 되어, 정작 만들어둔 loading.tsx가 뜰 기회조차 없어집니다. 화면에
// 보이지도 않는 <script> 태그 하나 때문에 전체가 막히는 걸 막으려고 별도
// 컴포넌트로 분리해 Suspense로 감쌉니다.
async function OrganizationJsonLd() {
  const [settings, ratingAgg] = await Promise.all([
    getBusinessSettings(),
    // 지어낸 평점을 노출하지 않기 위해, 관리자가 실제로 입력한 평점이 있는
    // 후기만 집계합니다 — 평점 없는 후기는 이 평균에 전혀 영향을 주지 않습니다.
    prisma.review.aggregate({
      where: { publishedAt: { not: null }, rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "ko-KR",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#org`,
      name: settings.businessName || SITE_NAME,
      alternateName: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/apple-icon`,
      image: `${SITE_URL}/opengraph-image`,
      areaServed: { "@type": "Country", name: "대한민국" },
      knowsLanguage: "ko",
      slogan: "돈 받고 만드는 이상, 제대로 만듭니다",
      knowsAbout: [
        "카카오톡 챗봇 개발",
        "텔레그램 봇 개발",
        "업무 자동화",
        "관리자 대시보드 개발",
        "API 연동",
        "소프트웨어 개발 외주",
      ],
      ...(settings.representativeName
        ? { founder: { "@type": "Person", name: settings.representativeName } }
        : {}),
      ...(settings.phone ? { telephone: settings.phone } : {}),
      ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
      ...(settings.address
        ? { address: { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "KR" } }
        : {}),
      ...(ratingAgg._count.rating > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: ratingAgg._avg.rating!.toFixed(1),
              reviewCount: ratingAgg._count.rating,
            },
          }
        : {}),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLdScript({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      data-scroll-behavior="smooth"
      className={`${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <Suspense fallback={null}>
          <OrganizationJsonLd />
        </Suspense>
        <AnalyticsBeacon />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
