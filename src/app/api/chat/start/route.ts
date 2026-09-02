import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/customer-auth";
import { isSameOrigin } from "@/lib/csrf";
import { limitChatMessage } from "@/lib/ratelimit";
import { chatStartSchema } from "@/lib/validation/inquiry";
import { createConversation, postCustomerMessage, postCustomerAttachment } from "@/lib/chat";
import { getOrCreateAnalyticsSessionId, logAnalyticsEvent } from "@/lib/analytics";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireCustomerSession();
  if (!session?.customerId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const allowed = await limitChatMessage(session.customerId);
  if (!allowed) {
    return NextResponse.json({ error: "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const parsed = chatStartSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }
  const { message, budget, preferredTimeline, attachmentUrl, attachmentName, attachmentMime } =
    parsed.data;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { name: true, email: true },
  });
  if (!customer) {
    return NextResponse.json({ error: "계정을 찾을 수 없습니다." }, { status: 401 });
  }

  const title = message.replace(/\s+/g, " ").trim().slice(0, 24) || "프로젝트 문의";
  const conversation = await createConversation(session.customerId, title);

  await prisma.inquiry.create({
    data: {
      name: customer.name ?? customer.email,
      email: customer.email,
      message,
      budget: budget ?? null,
      preferredTimeline: preferredTimeline ?? null,
      attachmentUrl: attachmentUrl ?? null,
      attachmentName: attachmentName ?? null,
      attachmentMime: attachmentMime ?? null,
      customerId: session.customerId,
      conversationId: conversation.id,
    },
  });

  // 첫 채팅 메시지로 요약을 남깁니다 — 관리자 알림(이메일·Slack·텔레그램)은 이 경로에서 자동 발송.
  const summary = [
    budget ? `예산: ${budget}` : null,
    preferredTimeline ? `희망 일정: ${preferredTimeline}` : null,
    "",
    message,
  ]
    .filter((l) => l !== null)
    .join("\n");

  try {
    await postCustomerMessage({
      customerId: session.customerId,
      conversationId: conversation.id,
      body: summary,
    });
    if (attachmentUrl && attachmentName && attachmentMime) {
      await postCustomerAttachment({
        customerId: session.customerId,
        conversationId: conversation.id,
        url: attachmentUrl,
        name: attachmentName,
        mime: attachmentMime,
      });
    }
  } catch (err) {
    console.error("[chat/start] 첫 메시지 전송 실패:", err);
  }

  // 전환 이벤트 — 서버에서만 기록해 위조를 막습니다.
  try {
    const sid = await getOrCreateAnalyticsSessionId();
    await logAnalyticsEvent({ type: "CONTACT_SUBMITTED", path: "/chat", sessionId: sid });
  } catch {
    // 무시.
  }

  return NextResponse.json({ ok: true, conversationId: conversation.id });
}
