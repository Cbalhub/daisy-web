import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
// Pretendard 동적 서브셋 @font-face 92개(unicode-range 분할). 파일은 이 import 로
// 번들·압축되고, 참조하는 woff2 는 public/fonts/pretendard/ 에서 서빙됩니다.
import "@/styles/pretendard-subset.css";
import { AnalyticsBeacon } from "@/components/analytics/AnalyticsBeacon";
import { ToastProvider } from "@/components/ui/Toast";
import { getBusinessSettings } from "@/lib/settings";
import { jsonLdScript } from "@/lib/json-ld";
import { SITE_URL, SITE_NAME } from "@/lib/site";

// 본문·UI 는 Pretendard 하나 — 제목/본문/숫자 모두. 위계는 굵기(400·600·800)와
// 크기·자간으로만. 등폭이 필요한 곳(문서 해시 등)만 OS 기본 등폭.
//
// Pretendard 는 next/font 로 통짜 2MB woff2 를 받던 걸 그만두고, public/fonts 에
// 자체 호스팅하는 "동적 서브셋"(unicode-range 로 쪼갠 92개 청크)으로 바꿨습니다.
// 브라우저는 페이지에 실제로 나온 글자가 든 청크만 받으므로, 첫 로딩에 폰트로만
// 2MB 씩 나가던 게 한글 페이지 기준 300~500KB 로 줄고 청크별로 캐시됩니다.
// @font-face 정의는 public/fonts/pretendard/pretendard-subset.css, 아래 <head> 에서
// <link> 로 부르고 가장 흔한 청크(라틴+상용 한글)만 preload 합니다.

// 로고 워드마크 "MOVD" 전용 손글씨 — 그 외 어디에도 쓰지 않습니다. 라틴 서브셋만
// 담긴 13KB woff2 (Architects Daughter, OFL). 단일 굵기라 굵기는 워드마크 쪽에서
// -webkit-text-stroke 로 살짝 불립니다.
const architects = localFont({
  src: "../fonts/ArchitectsDaughter-Latin.woff2",
  variable: "--font-architects",
  weight: "400",
  display: "swap",
});

const SITE_TITLE = "MOVD — 챗봇·자동화·관리자 도구 개발 외주";
const SITE_DESCRIPTION =
  "카카오톡·텔레그램 챗봇, 업무 자동화, 관리자 대시보드를 만듭니다. 예산 먼저 듣고 그 안에서 설계하며, 상담부터 배포까지 대표가 직접 하는 소프트웨어 개발 외주 MOVD.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | MOVD",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  // 구글은 keywords 를 무시하지만 네이버·빙은 아직 약하게 참고합니다 — 국내 유입
  // 비중이 커서 넣어 둡니다.
  keywords: [
    "챗봇 개발",
    "카카오톡 챗봇",
    "텔레그램 봇 개발",
    "업무 자동화",
    "관리자 페이지 개발",
    "관리자 대시보드 제작",
    "API 연동 개발",
    "소프트웨어 외주",
    "프로그램 개발 외주",
    "MOVD",
  ],
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
  const settings = await getBusinessSettings();
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
      // aggregateRating 은 후기가 실제로 보이는 /reviews 페이지에서만 노출합니다.
      // (전역 레이아웃에도 넣으면 /reviews 에서 집계 평점이 2개로 잡혀 Search Console 오류)
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
      suppressHydrationWarning
      className={`${architects.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {/* Pretendard 동적 서브셋 — 브라우저는 페이지에 실제 등장한 글자가 든 청크만
            받습니다(@font-face 정의는 위 import). 라틴+상용 한글이 든 청크(91·90·89)만
            preload 해서 첫 문단이 시스템 폰트 대체 없이 바로 뜨게 합니다. React 19 가
            이 <link> 들을 <head> 로 올려줍니다. */}
        <link
          rel="preload"
          href="/fonts/pretendard/PretendardVariable.subset.91.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/pretendard/PretendardVariable.subset.90.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/pretendard/PretendardVariable.subset.89.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* 다크/라이트 토글 — 저장된 선택을 페인트 전에 반영해 깜빡임 방지 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('movd-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
        {/* 로고·마크에 손그림 느낌을 주는 왜곡 필터 — feTurbulence 로 만든 노이즈를
            변위맵으로 써서 깔끔한 도형/글자의 가장자리를 살짝 흔듭니다. */}
        <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
          <filter id="rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <Suspense fallback={null}>
          <OrganizationJsonLd />
        </Suspense>
        <AnalyticsBeacon />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
