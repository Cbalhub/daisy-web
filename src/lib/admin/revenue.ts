import "server-only";
import { prisma } from "@/lib/prisma";

const DAILY_CHART_DAYS = 14;

export type DailyPoint = { label: string; value: number };

/**
 * 최근 14일간 결제완료(PAID) 금액을 일별로 집계합니다. 대시보드 매출 추이
 * 차트에 사용됩니다.
 */
export async function getDailyRevenue(): Promise<DailyPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - (DAILY_CHART_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: { status: "PAID", approvedAt: { gte: since } },
    select: { amount: true, approvedAt: true },
  });

  const sums = new Map<string, number>();
  for (const p of payments) {
    if (!p.approvedAt) continue;
    const day = p.approvedAt.toISOString().slice(0, 10);
    sums.set(day, (sums.get(day) ?? 0) + p.amount);
  }

  const days: DailyPoint[] = [];
  for (let i = DAILY_CHART_DAYS - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    days.push({ label: key.slice(5), value: sums.get(key) ?? 0 });
  }
  return days;
}

/**
 * 최근 14일간 새로 생성된 대화(=문의) 수를 일별로 집계합니다. 대시보드 문의
 * 추이 차트에 사용됩니다.
 */
export async function getDailyConversations(): Promise<DailyPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - (DAILY_CHART_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const conversations = await prisma.chatConversation.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const counts = new Map<string, number>();
  for (const c of conversations) {
    const day = c.createdAt.toISOString().slice(0, 10);
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
