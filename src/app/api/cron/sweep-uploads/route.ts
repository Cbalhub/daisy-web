import { NextRequest, NextResponse } from "next/server";
import { sweepOrphanUploads } from "@/lib/sweep-uploads";
import { sendSlackText } from "@/lib/slack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// public/uploads 에서 DB 어디에서도 참조하지 않는 파일(관리자가 올렸다 안 쓴 이미지 등)을
// 청소합니다. VPS crontab 예:
//   30 4 * * * curl -sf -H "Authorization: Bearer $CRON_SECRET" https://<도메인>/api/cron/sweep-uploads
//
// CRON_SECRET 이 설정돼 있으면 Bearer 토큰을 요구합니다(없으면 누구나 호출 가능 —
// 삭제만 하는 안전한 작업이지만 설정 권장).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ?dryRun=1 — 지우지 않고 무엇이 지워질지만 셉니다(처음 한 번 확인용).
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  const result = await sweepOrphanUploads({ dryRun });

  if (!dryRun && result.deleted > 0) {
    const mb = (result.freedBytes / (1024 * 1024)).toFixed(1);
    await sendSlackText(
      `🧹 업로드 정리 — 고아 파일 ${result.deleted}개 삭제 (${mb}MB 확보). ` +
        `스캔 ${result.scanned}개, 최근 파일 ${result.keptRecent}개 보존.`,
      {
        webhook: process.env.SLACK_WEBHOOK_URL_REPORT || undefined,
        username: "MOVD 리포트",
        iconEmoji: ":broom:",
      }
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true, dryRun, ...result });
}
