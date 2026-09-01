import "server-only";
import { prisma } from "@/lib/prisma";

// 매일 09:00(KST) 크론이 호출 — 전날(00:00~24:00 KST) 방문 요약을 만들어 Slack 으로.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kstDayStart(d: Date): Date {
  const k = new Date(d.getTime() + KST_OFFSET_MS);
  const midnightKst = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate());
  return new Date(midnightKst - KST_OFFSET_MS);
}

type Ev = { type: string; path: string; sessionId: string; referrer: string | null; createdAt: Date };

function summarize(events: Ev[]) {
  const visitors = new Set<string>();
  let pageViews = 0;
  const pageCount = new Map<string, number>();
  const refCount = new Map<string, number>();
  let contacts = 0;
  let checkoutStart = 0;
  let checkoutDone = 0;

  for (const e of events) {
    if (e.type === "PAGE_VIEW") {
      visitors.add(e.sessionId);
      pageViews += 1;
      pageCount.set(e.path, (pageCount.get(e.path) ?? 0) + 1);
      const ref = normalizeRef(e.referrer);
      refCount.set(ref, (refCount.get(ref) ?? 0) + 1);
    }
    if (e.type === "CONTACT_SUBMITTED") contacts += 1;
    if (e.type === "CHECKOUT_STARTED") checkoutStart += 1;
    if (e.type === "CHECKOUT_COMPLETED") checkoutDone += 1;
  }

  return {
    visitors: visitors.size,
    pageViews,
    contacts,
    checkoutStart,
    checkoutDone,
    topPages: top(pageCount, 5),
    topRefs: top(refCount, 4),
  };
}

function normalizeRef(referrer: string | null): string {
  if (!referrer) return "직접 방문";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("google")) return "구글";
    if (host.includes("naver")) return "네이버";
    if (host.includes("daum") || host.includes("kakao")) return "다음·카카오";
    if (host.includes("bing")) return "빙";
    if (host.includes("instagram")) return "인스타그램";
    if (host.includes("t.co") || host.includes("twitter") || host.includes("x.com")) return "X(트위터)";
    return host;
  } catch {
    return "기타";
  }
}

function top(map: Map<string, number>, n: number): { key: string; count: number }[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

function delta(today: number, prev: number): string {
  const d = today - prev;
  if (d === 0) return "(전일 동일)";
  return d > 0 ? `(▲ ${d})` : `(▼ ${Math.abs(d)})`;
}

/**
 * 전날 방문 요약 문자열. Slack sendSlackText 로 그대로 보냅니다.
 */
export async function buildDailyVisitorReport(now: Date = new Date()): Promise<string> {
  const todayStart = kstDayStart(now);
  const yStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const yBeforeStart = new Date(yStart.getTime() - 24 * 60 * 60 * 1000);

  const rows = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: yBeforeStart, lt: todayStart } },
    select: { type: true, path: true, sessionId: true, referrer: true, createdAt: true },
  });

  const yesterday = rows.filter((r) => r.createdAt >= yStart);
  const dayBefore = rows.filter((r) => r.createdAt < yStart);

  const a = summarize(yesterday);
  const b = summarize(dayBefore);

  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(yStart);

  const lines: string[] = [
    `📊 ${dateLabel} 방문 리포트`,
    "",
    `· 순 방문자  ${a.visitors}명  ${delta(a.visitors, b.visitors)}`,
    `· 페이지뷰  ${a.pageViews}회  ${delta(a.pageViews, b.pageViews)}`,
    `· 문의 제출  ${a.contacts}건${a.checkoutStart || a.checkoutDone ? `  ·  결제 시작 ${a.checkoutStart} / 완료 ${a.checkoutDone}` : ""}`,
  ];

  if (a.topPages.length) {
    lines.push("", "인기 페이지");
    for (const p of a.topPages) lines.push(`  ${p.key}  —  ${p.count}`);
  }
  if (a.topRefs.length) {
    lines.push("", "유입 경로");
    for (const r of a.topRefs) lines.push(`  ${r.key}  —  ${r.count}`);
  }

  if (a.visitors === 0 && a.pageViews === 0) {
    return `📊 ${dateLabel} 방문 리포트\n\n어제는 기록된 방문이 없습니다.`;
  }

  return lines.join("\n");
}
