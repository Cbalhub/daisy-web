"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    // 유입 채널 — 랜딩 URL 의 utm_* 파라미터와 외부 리퍼러 호스트.
    const utm: Record<string, string> = {};
    let referrerHost: string | undefined;
    try {
      const q = new URLSearchParams(window.location.search);
      const s = q.get("utm_source");
      const m = q.get("utm_medium");
      const c = q.get("utm_campaign");
      if (s) utm.utmSource = s;
      if (m) utm.utmMedium = m;
      if (c) utm.utmCampaign = c;
      if (document.referrer) {
        const h = new URL(document.referrer).host;
        if (h && h !== window.location.host) referrerHost = h;
      }
    } catch {
      // 무시.
    }

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "PAGE_VIEW", path: pathname, ...utm, referrerHost }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
