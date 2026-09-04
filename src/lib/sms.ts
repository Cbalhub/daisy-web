import "server-only";
import { createHmac, randomBytes } from "crypto";

/**
 * Solapi(구 쿨SMS)로 문자 한 통을 보냅니다. 고객이 이메일을 잘 안 봐서 관리자
 * 답장 확인이 느린 문제를 위해, 답장 시 고객에게 "새 답변 도착" 문자를 보냅니다.
 *
 * 설정(.env): SOLAPI_API_KEY, SOLAPI_API_SECRET, SMS_SENDER(등록된 발신번호).
 * 셋 중 하나라도 없으면 조용히 넘어갑니다. 90byte 초과면 자동으로 LMS 로 발송됩니다.
 */
const API = "https://api.solapi.com/messages/v4/send";

export function isSmsConfigured() {
  return Boolean(
    process.env.SOLAPI_API_KEY && process.env.SOLAPI_API_SECRET && process.env.SMS_SENDER
  );
}

function onlyDigits(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

export async function sendSms(
  toRaw: string,
  text: string
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SMS_SENDER;
  if (!apiKey || !apiSecret || !from) return { sent: false, reason: "not-configured" };

  const to = onlyDigits(toRaw);
  if (to.length < 9 || to.length > 11) return { sent: false, reason: "invalid-number" };

  const date = new Date().toISOString();
  const salt = randomBytes(16).toString("hex");
  const signature = createHmac("sha256", apiSecret).update(date + salt).digest("hex");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({
        message: { to, from: onlyDigits(from), text: text.slice(0, 2000) },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[sms] 발송 실패:", res.status, detail.slice(0, 300));
      return { sent: false, reason: `http ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("[sms] 발송 예외:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}
