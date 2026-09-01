import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateAnalyticsSessionId, logAnalyticsEvent } from "@/lib/analytics";
import { limitTrack } from "@/lib/ratelimit";
import { clientIp } from "@/lib/request-ip";

export const runtime = "nodejs";

function getClientIp(req: NextRequest) {
  return clientIp(req) ?? "unknown";
}

// 클라이언트에서 직접 보낼 수 있는 이벤트만 허용합니다.
// CONTACT_SUBMITTED / CHECKOUT_COMPLETED 같은 전환 이벤트는 서버 로직에서만 기록해
// 위조된 전환 수치가 통계에 섞이지 않도록 합니다.
const trackSchema = z.object({
  type: z.enum(["PAGE_VIEW", "CHECKOUT_STARTED"]),
  path: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  // 로그인 없이 누구나 호출할 수 있는 엔드포인트라, IP 기준으로 스팸을 막습니다.
  const allowed = await limitTrack(getClientIp(req));
  if (!allowed) {
    return NextResponse.json({ ok: true }); // 조용히 무시 — 정상 방문자 경험을 막지 않음
  }

  const parsed = trackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const sessionId = await getOrCreateAnalyticsSessionId();
  await logAnalyticsEvent({
    type: parsed.data.type,
    path: parsed.data.path,
    sessionId,
    referrer: req.headers.get("referer"),
  });

  return NextResponse.json({ ok: true });
}
