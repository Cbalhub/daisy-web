import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 크롤 자체가 무의미한 곳만 차단(관리자·API·리다이렉트 전용).
      // /account · /pay · /review 는 각 페이지의 noindex 메타를 구글이 실제로
      // 읽을 수 있도록 일부러 크롤을 허용합니다 — Disallow 하면 noindex 를 못 봄.
      disallow: ["/admin", "/api", "/chat", "/contact"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
