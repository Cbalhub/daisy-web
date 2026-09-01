import type { NextConfig } from "next";

// Next.js 개발 모드는 Fast Refresh/디버깅을 위해 내부적으로 eval()을 사용합니다.
// 프로덕션 빌드에는 절대 unsafe-eval을 포함하지 않습니다.
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob:`,
  `font-src 'self' data:`,
  `connect-src 'self'`,
  `frame-src 'self'`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // 개발 중에만 뜨는 우측 하단 "N" 인디케이터(라우트 정보 표시용) — 실제 방문자에게는
  // 절대 보이지 않지만 테스트 중 거슬려서 꺼둡니다. 빌드/런타임 에러는 그대로 표시됩니다.
  devIndicators: false,
  images: {
    // 포트폴리오·이벤트 이미지를 AVIF 우선으로 서빙합니다(webp 대비 20~30% 작음,
    // 미지원 브라우저는 자동으로 webp). sharp 가 설치돼 있어 VPS 에서 최적화됩니다.
    formats: ["image/avif", "image/webp"],
    // 업로드 파일명이 UUID 라 내용이 안 바뀝니다 — 최적화 결과를 오래 캐시해
    // 같은 이미지를 반복해서 다시 인코딩하지 않도록 합니다(기본 4시간 → 30일).
    minimumCacheTTL: 2_592_000,
  },
  // 같은 와이파이의 폰 등에서 `next dev -H 0.0.0.0` 로 띄운 서버에 LAN IP로 접속할 때,
  // Next 16 이 dev 리소스(JS 청크)를 cross-origin 으로 보고 막아 하이드레이션이 안 됩니다.
  // 실기기 테스트용 IP만 허용합니다(dev 전용 — 프로덕션 빌드에는 영향 없음).
  // IP가 바뀌면(DHCP 재할당) 여기 값을 갱신하고 dev 서버를 재시작하세요.
  allowedDevOrigins: ["192.168.1.2"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
