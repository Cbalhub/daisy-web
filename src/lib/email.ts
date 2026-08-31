import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const BRAND = { ink: "#141f2c", paper: "#ffffff", accent: "#3182f6", muted: "#87919c" };

// 고객명·주문명·메시지 미리보기처럼 사용자가 입력한 값을 HTML 템플릿에 그대로
// 꽂으면, 그 값에 <script>나 <img onerror=...> 같은 마크업이 섞여 있을 때
// 수신자의 메일 클라이언트에서 그대로 렌더링될 수 있습니다. text(plain) 필드는
// 렌더링되지 않으니 이스케이프가 필요 없지만, html 필드에 넣는 값은 전부
// 이 함수를 거칩니다.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailShell(bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:32px 16px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:${BRAND.paper};border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px 32px 8px;">
          <p style="margin:0;font-size:15px;font-weight:700;color:${BRAND.ink};letter-spacing:-0.01em;">MOVD</p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 32px 32px;">${bodyHtml}</td>
      </tr>
    </table>
  </body>
</html>`;
}

function emailButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 22px;background:${BRAND.accent};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;">${label}</a>`;
}

/**
 * 고객이 채팅에 메시지를 남겼는데 관리자가 대시보드를 보고 있지 않을 수 있으므로,
 * 메일로 알립니다. 호출하는 쪽(lib/chat.ts)에서 "관리자 답장 이후 첫 메시지"일
 * 때만 불러 연속 메시지마다 메일이 쏟아지는 것을 막습니다.
 */
export async function sendNewMessageNotification(input: {
  customerName: string;
  preview: string;
  conversationId: string;
}) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!resend || !to) {
    // 이메일 발송이 구성되지 않은 환경(로컬 개발 등)에서는 조용히 건너뜁니다.
    return;
  }

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const chatUrl = `${siteUrl}/admin/chats/${input.conversationId}`;

  const { error } = await resend.emails.send({
    // TODO: overcook.kr 도메인을 Resend에서 인증하면 아래를
    // "MOVD 웹사이트 <notify@overcook.kr>"로 되돌리세요. 그 전까지는 미인증
    // 도메인 발송이 막혀 있어, 관리자 본인 이메일로만 보낼 수 있는 Resend
    // 기본(sandbox) 발신자를 임시로 씁니다.
    from: "MOVD 웹사이트 <onboarding@resend.dev>",
    to,
    subject: `[새 메시지] ${input.customerName}`,
    text: [
      `${input.customerName} 님이 새 메시지를 보냈습니다.`,
      "",
      input.preview,
      "",
      chatUrl,
    ].join("\n"),
    html: emailShell(`
      <p style="margin:0 0 4px;font-size:13px;color:${BRAND.muted};">새 메시지</p>
      <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND.ink};">${escapeHtml(input.customerName)} 님</h1>
      <p style="margin:0;padding:14px 16px;background:#f5f5f7;border-radius:12px;font-size:14px;line-height:1.6;color:${BRAND.ink};white-space:pre-line;">${escapeHtml(input.preview)}</p>
      ${emailButton(chatUrl, "채팅 열기")}
    `),
  });

  // resend SDK는 발송 실패 시 예외를 던지지 않고 { error } 필드로 알려줍니다 —
  // 확인하지 않으면 실패해도 조용히 넘어가서 관리자가 영영 알림을 못 받습니다.
  if (error) throw new Error(`resend 발송 실패: ${error.message}`);
}

/**
 * 결제(카드/간편결제/가상계좌 입금)가 실제로 확정됐을 때 고객에게 보내는 확인 메일입니다.
 * payment-service.ts의 applyPaidResult에서, 입금자명 불일치로 자동 환불되는 케이스를
 * 제외하고 정상적으로 결제완료 처리된 경우에만 호출됩니다.
 */
/**
 * 관리자가 주문에서 용역계약서를 발행하면, 고객에게 서명 링크를 보냅니다.
 */
export async function sendContractRequestEmail(input: {
  customerEmail: string;
  customerName: string;
  orderTitle: string;
  amount: number;
  token: string;
}) {
  if (!resend) return;

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const url = `${siteUrl}/contract/${input.token}`;
  const amountText = `₩${input.amount.toLocaleString("ko-KR")}`;

  const { error } = await resend.emails.send({
    from: "MOVD 웹사이트 <notify@overcook.kr>",
    to: input.customerEmail,
    subject: `[MOVD] 용역계약서 확인 및 서명 요청 — ${input.orderTitle}`,
    text: [
      `${input.customerName} 님, 용역계약서를 보내드립니다.`,
      "",
      `프로젝트: ${input.orderTitle}`,
      `계약 금액: ${amountText} (부가세 별도)`,
      "",
      `아래 링크에서 내용을 확인하고 서명해 주세요:`,
      url,
    ].join("\n"),
    html: emailShell(`
      <p style="margin:0 0 4px;font-size:13px;color:${BRAND.muted};">용역계약서</p>
      <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND.ink};">${escapeHtml(input.customerName)} 님, 계약서를 확인해 주세요</h1>
      <table role="presentation" width="100%" style="background:#f5f5f7;border-radius:12px;">
        <tr>
          <td style="padding:16px 18px;">
            <p style="margin:0;font-size:13px;color:${BRAND.muted};">${escapeHtml(input.orderTitle)}</p>
            <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:${BRAND.ink};">${amountText}</p>
            <p style="margin:2px 0 0;font-size:12px;color:${BRAND.muted};">부가세 별도</p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
        링크에서 계약 내용을 확인하고 서명하시면 계약이 체결됩니다. 서명본은 링크에서 다시 볼 수 있어요.
      </p>
      ${emailButton(url, "계약서 확인하고 서명하기")}
    `),
  });

  if (error) throw new Error(`resend 발송 실패: ${error.message}`);
}

export async function sendPaymentConfirmedEmail(input: {
  customerEmail: string;
  customerName: string;
  orderTitle: string;
  amount: number;
  orderToken: string;
}) {
  if (!resend) return;

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const receiptUrl = `${siteUrl}/pay/${input.orderToken}/receipt`;
  const amountText = `₩${input.amount.toLocaleString("ko-KR")}`;

  const { error } = await resend.emails.send({
    from: "MOVD 웹사이트 <notify@overcook.kr>",
    to: input.customerEmail,
    subject: `[MOVD] 결제가 완료됐어요 — ${input.orderTitle}`,
    text: [
      `${input.customerName} 님, 결제가 정상적으로 완료됐어요.`,
      "",
      `주문: ${input.orderTitle}`,
      `결제 금액: ${amountText}`,
      "",
      `영수증 보기: ${receiptUrl}`,
    ].join("\n"),
    html: emailShell(`
      <p style="margin:0 0 4px;font-size:13px;color:${BRAND.muted};">결제 완료</p>
      <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND.ink};">${escapeHtml(input.customerName)} 님, 결제가 완료됐어요</h1>
      <table role="presentation" width="100%" style="background:#f5f5f7;border-radius:12px;">
        <tr>
          <td style="padding:16px 18px;">
            <p style="margin:0;font-size:13px;color:${BRAND.muted};">${escapeHtml(input.orderTitle)}</p>
            <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:${BRAND.ink};">${amountText}</p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
        진행 상황은 채팅에서 계속 안내해 드려요.
      </p>
      ${emailButton(receiptUrl, "영수증 보기")}
    `),
  });

  if (error) throw new Error(`resend 발송 실패: ${error.message}`);
}

/**
 * 프로젝트 진행 단계가 "전달완료"로 바뀌면 고객에게 후기를 부탁하는 메일입니다.
 * lib/progress.ts의 updateOrderProgress에서, 다른 단계로의 전환에는 보내지 않고
 * DELIVERED로 전환될 때만 호출합니다.
 */
export async function sendReviewRequestEmail(input: {
  customerEmail: string;
  customerName: string;
  orderTitle: string;
  orderToken: string;
}) {
  if (!resend) return;

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const reviewUrl = `${siteUrl}/review/${input.orderToken}`;

  const { error } = await resend.emails.send({
    from: "MOVD 웹사이트 <notify@overcook.kr>",
    to: input.customerEmail,
    subject: `[MOVD] "${input.orderTitle}" 프로젝트, 어떠셨나요?`,
    text: [
      `${input.customerName} 님, 프로젝트 전달이 완료됐어요.`,
      "",
      `"${input.orderTitle}" 프로젝트는 어떠셨나요?`,
      "짧게라도 후기를 남겨주시면 큰 힘이 돼요.",
      "",
      `후기 남기기: ${reviewUrl}`,
    ].join("\n"),
    html: emailShell(`
      <p style="margin:0 0 4px;font-size:13px;color:${BRAND.muted};">전달 완료</p>
      <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND.ink};">${escapeHtml(input.customerName)} 님, 어떠셨나요?</h1>
      <p style="margin:0;padding:14px 16px;background:#f5f5f7;border-radius:12px;font-size:14px;line-height:1.6;color:${BRAND.ink};">
        &ldquo;${escapeHtml(input.orderTitle)}&rdquo; 프로젝트 전달이 완료됐어요. 짧게라도 후기를 남겨주시면 큰 힘이 돼요.
      </p>
      ${emailButton(reviewUrl, "후기 남기기")}
    `),
  });

  if (error) throw new Error(`resend 발송 실패: ${error.message}`);
}

/**
 * 대표님 본인에게 보내는 일회성 작업 완료 알림입니다(고객 대상 메일이 아님).
 * 호출하는 쪽에서 요약 텍스트를 그대로 전달합니다.
 */
export async function sendOwnerNotification(input: { subject: string; bodyText: string }) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!resend || !to) return { sent: false, reason: "not-configured" as const };

  const { error } = await resend.emails.send({
    from: "MOVD 웹사이트 <onboarding@resend.dev>",
    to,
    subject: input.subject,
    text: input.bodyText,
    html: emailShell(
      `<div style="font-size:14px;line-height:1.7;color:${BRAND.ink};white-space:pre-line;">${escapeHtml(input.bodyText)}</div>`
    ),
  });

  if (error) return { sent: false, reason: error.message };
  return { sent: true as const };
}
