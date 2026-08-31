import "server-only";

/**
 * Slack Incoming Webhook 으로 한 줄 알림을 보냅니다. 대표님이 폰에서 Slack 앱
 * 푸시로 바로 받아볼 수 있게 하는 용도입니다.
 *
 * SLACK_WEBHOOK_URL 이 없으면(로컬 등) 조용히 넘어갑니다. 발송 실패가 본래
 * 작업(서명 처리 등)을 막으면 안 되므로, 이 함수는 예외를 던지지 않고
 * 성공 여부만 돌려줍니다.
 */
export async function sendSlackText(
  text: string,
  opts?: { url?: string; urlLabel?: string }
): Promise<{ sent: boolean; reason?: string }> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return { sent: false, reason: "not-configured" };

  // 링크가 있으면 Slack mrkdwn 형식(<url|label>)으로 덧붙입니다.
  const body = opts?.url
    ? `${text}\n<${opts.url}|${opts.urlLabel ?? opts.url}>`
    : text;

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: body }),
      // Slack 응답이 느려도 요청 처리를 오래 붙잡지 않도록.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { sent: false, reason: `http ${res.status}` };
    return { sent: true };
  } catch (err) {
    console.error("[slack] 알림 발송 실패:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}
