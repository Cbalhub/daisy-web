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
