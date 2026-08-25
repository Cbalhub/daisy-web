import "server-only";
import { prisma } from "@/lib/prisma";

const FUNNEL_WINDOW_DAYS = 30;
const DAILY_CHART_DAYS = 14;

export type FunnelStep = { label: string; count: number };
export type ExitPage = { path: string; count: number };
export type DailyPoint = { label: string; value: number };

/**
 * 방문→문의→결제 퍼널과 세션별 마지막 방문 페이지(이탈 페이지)를 집계합니다.
 * 이벤트 수가 많아지면 매 요청마다 전체를 훑는 이 방식 대신 배치 집계 테이블로
 * 옮기는 것이 좋습니다 — 지금 규모(스타트업 초기 트래픽)에서는 충분합니다.
 */
export async function getFunnelOverview() {
  const since = new Date(Date.now() - FUNNEL_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const events = await prisma.analyticsEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { type: true, path: true, sessionId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const sessionsByType = groupSessionsByEventType(events);
  const exitPages = computeExitPages(events);
  const dailyPageViews = computeDailyPageViews(events);

  const funnel: FunnelStep[] = [
    { label: "방문", count: sessionsByType.PAGE_VIEW.size },
    { label: "문의 제출", count: sessionsByType.CONTACT_SUBMITTED.size },
    { label: "결제 시작", count: sessionsByType.CHECKOUT_STARTED.size },
    { label: "결제 완료", count: sessionsByType.CHECKOUT_COMPLETED.size },
  ];

  return { funnel, exitPages, dailyPageViews, windowDays: FUNNEL_WINDOW_DAYS };
}

type RawEvent = { type: string; path: string; sessionId: string; createdAt: Date };

function groupSessionsByEventType(events: RawEvent[]) {
  const sessionsByType: Record<string, Set<string>> = {
    PAGE_VIEW: new Set(),
    CONTACT_SUBMITTED: new Set(),
    CHECKOUT_STARTED: new Set(),
    CHECKOUT_COMPLETED: new Set(),
  };
  for (const e of events) {
    sessionsByType[e.type]?.add(e.sessionId);
  }
  return sessionsByType;
}

function computeExitPages(events: RawEvent[]): ExitPage[] {
  const lastPageViewPerSession = new Map<string, string>();
  for (const e of events) {
    if (e.type === "PAGE_VIEW") {
      // 이벤트가 시간순 정렬되어 있으므로, 세션별로 마지막에 덮어써진 값이 곧 마지막 방문 페이지
      lastPageViewPerSession.set(e.sessionId, e.path);
    }
  }

  const counts = new Map<string, number>();
  for (const path of lastPageViewPerSession.values()) {
    counts.set(path, (counts.get(path) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({ path, count }));
}

function computeDailyPageViews(events: RawEvent[]): DailyPoint[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.type !== "PAGE_VIEW") continue;
    const day = e.createdAt.toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const days: DailyPoint[] = [];
  for (let i = DAILY_CHART_DAYS - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    days.push({ label: key.slice(5), value: counts.get(key) ?? 0 });
  }
  return days;
}
