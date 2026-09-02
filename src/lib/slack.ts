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
  opts?: {
    url?: string;
    urlLabel?: string;
    webhook?: string;
    // 알림 종류별 표시 이름·아이콘. 2020년 이후 만든 Slack 앱은 이 override 를
    // 무시하고 앱 아이덴티티만 쓸 수 있습니다 — 그 경우 api.slack.com/apps 의
    // Display Information 에서 바꿔야 합니다.
    username?: string;
    iconEmoji?: string;
  }
): Promise<{ sent: boolean; reason?: string }> {
  // opts.webhook 로 채널별 웹훅을 넘길 수 있습니다(예: 일일 리포트는 별도 채널).
  const webhook = opts?.webhook || process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return { sent: false, reason: "not-configured" };

  // 링크가 있으면 Slack mrkdwn 형식(<url|label>)으로 덧붙입니다.
  const body = opts?.url
    ? `${text}\n<${opts.url}|${opts.urlLabel ?? opts.url}>`
    : text;

  const payload: Record<string, string> = {
    text: body,
    username: opts?.username ?? "MOVD",
  };
  if (opts?.iconEmoji) payload.icon_emoji = opts.iconEmoji;

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
