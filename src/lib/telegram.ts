import "server-only";

/**
 * 텔레그램 봇으로 한 줄 알림을 보냅니다. Slack Incoming Webhook(lib/slack.ts)과
 * 같은 역할 — 대표님이 폰 텔레그램 푸시로 새 문의·결제·서명을 바로 받아볼 수
 * 있게 합니다. 슬랙과 병행해서(둘 중 하나만 설정해도) 씁니다.
 *
 * 설정: @BotFather 로 봇을 만들어 TELEGRAM_BOT_TOKEN 을, 봇과 1:1 대화를 시작한 뒤
 * https://api.telegram.org/bot<token>/getUpdates 의 result[].message.chat.id 를
 * TELEGRAM_CHAT_ID 에 넣습니다. 둘 중 하나라도 없으면 조용히 넘어갑니다.
 *
 * 발송 실패가 본래 작업(서명 처리 등)을 막으면 안 되므로 예외를 던지지 않고
 * 성공 여부만 돌려줍니다.
 */
export async function sendTelegramText(
  text: string,
  opts?: {
    url?: string;
    urlLabel?: string;
  }
): Promise<{ sent: boolean; reason?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { sent: false, reason: "not-configured" };

  // 텍스트는 Slack 알림과 공유하므로 HTML 특수문자만 이스케이프하고, 링크가 있으면
  // <a> 로 덧붙입니다. parse_mode=HTML 기준.
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const body = opts?.url
    ? `${escaped}\n<a href="${opts.url}">${opts.urlLabel ?? opts.url}</a>`
    : escaped;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: body,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { sent: false, reason: `http ${res.status}` };
    return { sent: true };
  } catch (err) {
    console.error("[telegram] 알림 발송 실패:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}
