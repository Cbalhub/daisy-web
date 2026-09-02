import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { AnalyticsEventType } from "@prisma/client";

const SESSION_COOKIE = "oc_sid";

// 익명 방문 세션 ID — 개인 식별 정보를 담지 않으며, 퍼널/이탈 분석 용도로만 사용합니다.
export async function getOrCreateAnalyticsSessionId() {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return id;
}

export async function readAnalyticsSessionId() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function logAnalyticsEvent(input: {
  type: AnalyticsEventType;
  path: string;
  sessionId: string;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrerHost?: string | null;
}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type: input.type,
        path: input.path.slice(0, 500),
        sessionId: input.sessionId,
        referrer: input.referrer?.slice(0, 500) || null,
        utmSource: input.utmSource?.slice(0, 120) || null,
        utmMedium: input.utmMedium?.slice(0, 120) || null,
        utmCampaign: input.utmCampaign?.slice(0, 120) || null,
        referrerHost: input.referrerHost?.slice(0, 120) || null,
      },
    });
  } catch {
    // 분석 로그 실패가 핵심 기능(문의 접수, 결제)을 막아서는 안 됩니다.
  }
}
