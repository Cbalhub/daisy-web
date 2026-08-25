import type { MetadataRoute } from "next";

const BASE_URL = "https://overcook.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/account", "/chat", "/pay"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
