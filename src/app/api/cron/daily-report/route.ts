import { NextRequest, NextResponse } from "next/server";
import { buildDailyVisitorReport } from "@/lib/analytics-report";
import { sendSlackText } from "@/lib/slack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel Cron 이 매일 00:00 UTC(= 09:00 KST) 에 호출합니다(vercel.json).
// CRON_SECRET 이 설정돼 있으면 Vercel 이 Authorization: Bearer <secret> 를 붙여
// 보내므로, 외부에서 임의로 이 엔드포인트를 때리는 걸 막습니다.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const report = await buildDailyVisitorReport();
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const result = await sendSlackText(report, {
    url: `${siteUrl}/admin`,
    urlLabel: "대시보드 열기",
  });

  return NextResponse.json({ ok: true, slack: result });
}
