import "server-only";

/**
 * Discord Incoming Webhook 으로 한 줄 알림을 보냅니다. 이미 디스코드에 상주하는
 * 팀이 새 문의·결제·계약 알림을 비공개 채널에서 바로 받게 하는 용도입니다.
 *
 * 설정: 서버 설정 > 연동 > 웹후크 > 새 웹후크 > 채널 선택 > URL 복사 →
 * .env 의 DISCORD_WEBHOOK_URL. 비우면 조용히 넘어갑니다(다른 채널엔 영향 없음).
 */
export async function sendDiscordText(
  text: string,
  opts?: { url?: string; urlLabel?: string; webhook?: string; username?: string }
): Promise<{ sent: boolean; reason?: string }> {
  const webhook = opts?.webhook || process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return { sent: false, reason: "not-configured" };

  const content = opts?.url
    ? `${text}\n${opts.urlLabel ? `${opts.urlLabel}: ` : ""}${opts.url}`
    : text;

  const payload: Record<string, unknown> = {
    content: content.slice(0, 1900),
    username: opts?.username ?? "MOVD",
    // 봇이 @everyone 등을 실수로 멘션하지 않도록.
    allowed_mentions: { parse: [] },
  };

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { sent: false, reason: `http ${res.status}` };
    return { sent: true };
  } catch (err) {
    console.error("[discord] 알림 발송 실패:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}

export function isDiscordConfigured() {
  return Boolean(process.env.DISCORD_WEBHOOK_URL);
}
