import "server-only";
import { prisma } from "@/lib/prisma";
import { sendNewMessageNotification } from "@/lib/email";
import { sendSlackText } from "@/lib/slack";
import { encryptFieldTagged, decryptFieldTagged } from "@/lib/crypto";

// 채팅 메시지 본문은 검색/필터링 대상이 아니라서(이름·연락처와 달리) 부분 일치
// 검색을 포기할 필요 없이 그대로 AES-256-GCM으로 암호화해 저장합니다. DB를
// 그대로 들여다봐도 대화 내용이 노출되지 않습니다.
function decryptMessage<T extends { body: string }>(message: T): T {
  return { ...message, body: decryptFieldTagged(message.body) };
}

const MAX_MESSAGE_LENGTH = 2000;
const DEFAULT_TITLE = "일반 문의";

// 결제 요청 카드를 그리는 데 필요한 최소한의 주문 정보만 노출합니다.
const ORDER_SUMMARY_SELECT = {
  id: true,
  orderToken: true,
  title: true,
  amount: true,
  currency: true,
  status: true,
  progressStage: true,
} as const;

// 채팅은 로그인한 고객(Customer) 계정에만 연결됩니다 — 그래서 "익명 방문자"
// 대화가 애초에 존재하지 않고, 관리자는 항상 누구와 대화 중인지 알 수 있습니다.
// 고객 한 명이 여러 프로젝트를 동시에 진행할 수 있어 대화는 1:N입니다.

export async function listCustomerConversations(customerId: string) {
  const conversations = await prisma.chatConversation.findMany({
    where: { customerId },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { sender: "ADMIN", read: false } } } },
    },
  });
  return conversations.map((c) => ({
    id: c.id,
    title: c.title || DEFAULT_TITLE,
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: c.messages[0] ? decryptFieldTagged(c.messages[0].body) : null,
    unreadCount: c._count.messages,
  }));
}

export async function createConversation(customerId: string, title?: string) {
  return prisma.chatConversation.create({
    data: { customerId, title: title?.trim() || null },
  });
}

/**
 * 고객이 아직 대화를 하나도 시작하지 않은 상태로 채팅에 처음 들어왔을 때 씁니다.
 * 기존 대화가 있으면 그중 가장 최근 것을, 없으면 새로 하나 만들어서 반환합니다.
 */
export async function getOrCreateDefaultConversation(customerId: string) {
  const existing = await prisma.chatConversation.findFirst({
    where: { customerId },
    orderBy: { lastMessageAt: "desc" },
  });
  if (existing) return existing;
  return createConversation(customerId);
}

/**
 * customerId(세션)로 소유권을 확인한 뒤 대화를 반환합니다. 다른 고객의
 * conversationId를 추측해 넘겨도 여기서 걸러집니다 — 채팅 관련 API는
 * 전부 이 함수를 거쳐야 합니다.
 */
async function requireOwnedConversation(customerId: string, conversationId: string) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation || conversation.customerId !== customerId) return null;
  return conversation;
}

/**
 * 이 대화의 가장 최근 메시지가 관리자 발송이었는지(=고객 메시지가 없었는지) 확인합니다.
 * 관리자 답장 이후 첫 고객 메시지일 때만 알림 메일을 보내서, 고객이 연속으로 여러
 * 메시지를 보내도 매번 메일이 쏟아지지 않게 합니다.
 */
async function shouldNotifyAdmin(conversationId: string) {
  const last = await prisma.chatMessage.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    select: { sender: true },
  });
  return !last || last.sender === "ADMIN";
}

async function notifyAdminOfNewMessage(
  customerId: string,
  conversationId: string,
  conversationTitle: string | null,
  preview: string
) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { name: true, email: true },
  });
  const customerLabel = customer?.name || customer?.email || "고객";
  const who = conversationTitle ? `${customerLabel} · ${conversationTitle}` : customerLabel;
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  await Promise.allSettled([
    sendNewMessageNotification({
      customerName: who,
      preview: preview.slice(0, 200),
      conversationId,
    }),
    sendSlackText(`💬 새 메시지 — ${who}\n${preview.slice(0, 200)}`, {
      url: `${siteUrl}/admin/chats/${conversationId}`,
      urlLabel: "채팅 열기",
    }),
  ]);
}

export async function postCustomerMessage(input: {
  customerId: string;
  conversationId: string;
  body: string;
}) {
  const body = input.body.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!body) throw new Error("EMPTY_MESSAGE");

  const conversation = await requireOwnedConversation(input.customerId, input.conversationId);
  if (!conversation) throw new Error("CONVERSATION_NOT_FOUND");

  const notify = await shouldNotifyAdmin(conversation.id);

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: { conversationId: conversation.id, sender: "VISITOR", body: encryptFieldTagged(body) },
    });
    await tx.chatConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: created.createdAt, status: "OPEN" },
    });
    return created;
  });

  if (notify) {
    notifyAdminOfNewMessage(input.customerId, conversation.id, conversation.title, body).catch(
      (err) => console.error("admin notify failed", err)
    );
  }

  return decryptMessage(message);
}

/**
 * 결제 페이지에서 고객이 "입금 완료했어요" 버튼을 눌렀을 때 씁니다. 결제 페이지는
 * orderToken만으로 접근하는 별도 흐름이라 로그인 세션이 없을 수 있어, 세션 기반
 * 소유권 확인(requireOwnedConversation)을 거치지 않고 호출하는 쪽(주문 조회로 이미
 * customerId/conversationId를 확보한 상태)에서 바로 씁니다.
 */
export async function postDepositClaimNotice(input: {
  customerId: string;
  conversationId: string;
  body: string;
}) {
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: {
        conversationId: input.conversationId,
        sender: "VISITOR",
        body: encryptFieldTagged(input.body),
      },
    });
    await tx.chatConversation.update({
      where: { id: input.conversationId },
      data: { lastMessageAt: created.createdAt, status: "OPEN" },
    });
    return created;
  });

  const conversation = await prisma.chatConversation.findUnique({
    where: { id: input.conversationId },
    select: { title: true },
  });
  notifyAdminOfNewMessage(input.customerId, input.conversationId, conversation?.title ?? null, input.body).catch(
    (err) => console.error("admin notify failed", err)
  );

  return decryptMessage(message);
}

export async function postAdminReply(input: { conversationId: string; body: string }) {
  const body = input.body.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!body) throw new Error("EMPTY_MESSAGE");

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: { conversationId: input.conversationId, sender: "ADMIN", body: encryptFieldTagged(body) },
    });
    await tx.chatConversation.update({
      where: { id: input.conversationId },
      data: { lastMessageAt: created.createdAt },
    });
    return created;
  });
  return decryptMessage(message);
}

type AttachmentInput = { url: string; name: string; mime: string };

export async function postCustomerAttachment(
  input: { customerId: string; conversationId: string } & AttachmentInput
) {
  const conversation = await requireOwnedConversation(input.customerId, input.conversationId);
  if (!conversation) throw new Error("CONVERSATION_NOT_FOUND");

  const notify = await shouldNotifyAdmin(conversation.id);

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: {
        conversationId: conversation.id,
        sender: "VISITOR",
        type: "ATTACHMENT",
        body: encryptFieldTagged(input.name),
        attachmentUrl: input.url,
        attachmentName: input.name,
        attachmentMime: input.mime,
      },
    });
    await tx.chatConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: created.createdAt, status: "OPEN" },
    });
    return created;
  });

  if (notify) {
    notifyAdminOfNewMessage(
      input.customerId,
      conversation.id,
      conversation.title,
      `📎 ${input.name}`
    ).catch((err) => console.error("admin notify failed", err));
  }

  return decryptMessage(message);
}

export async function postAdminAttachment(input: { conversationId: string } & AttachmentInput) {
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: {
        conversationId: input.conversationId,
        sender: "ADMIN",
        type: "ATTACHMENT",
        body: encryptFieldTagged(input.name),
        attachmentUrl: input.url,
        attachmentName: input.name,
        attachmentMime: input.mime,
      },
    });
    await tx.chatConversation.update({
      where: { id: input.conversationId },
      data: { lastMessageAt: created.createdAt },
    });
    return created;
  });
  return decryptMessage(message);
}

/**
 * 채팅 안에 결제 요청 카드를 올립니다. 실제 주문(Order) 생성은 호출하는 쪽
 * (관리자 API 라우트)에서 이미 끝낸 상태로, 여기서는 그 주문을 가리키는
 * 메시지만 추가합니다 — 주문 생성 로직을 여기 중복 구현하지 않기 위함입니다.
 */
export async function postPaymentRequestMessage(input: {
  conversationId: string;
  orderId: string;
  label: string;
}) {
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: {
        conversationId: input.conversationId,
        sender: "ADMIN",
        type: "PAYMENT_REQUEST",
        body: encryptFieldTagged(input.label),
        orderId: input.orderId,
      },
      include: { order: { select: ORDER_SUMMARY_SELECT } },
    });
    await tx.chatConversation.update({
      where: { id: input.conversationId },
      data: { lastMessageAt: created.createdAt },
    });
    return created;
  });
  return decryptMessage(message);
}

/**
 * 채팅 안에 진행 상황 업데이트 카드를 올립니다. 주문(Order)의 progressStage 갱신은
 * 호출하는 쪽(lib/progress.ts)에서 이미 끝낸 상태로, 여기서는 그 결과를 가리키는
 * 메시지만 추가합니다.
 */
export async function postProgressUpdateMessage(input: {
  conversationId: string;
  orderId: string;
  body: string;
}) {
  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: {
        conversationId: input.conversationId,
        sender: "ADMIN",
        type: "PROGRESS_UPDATE",
        body: encryptFieldTagged(input.body),
        orderId: input.orderId,
      },
      include: { order: { select: ORDER_SUMMARY_SELECT } },
    });
    await tx.chatConversation.update({
      where: { id: input.conversationId },
      data: { lastMessageAt: created.createdAt },
    });
    return created;
  });
  return decryptMessage(message);
}

/**
 * 로그인한 고객이 자신의 대화를 폴링할 때 사용합니다. customerId(세션)로 소유권을
 * 확인하기 때문에, 다른 사람이 conversationId를 추측해 남의 대화를 읽는 것이
 * 불가능합니다.
 */
export async function getCustomerConversation(
  customerId: string,
  conversationId: string,
  after?: Date
) {
  const conversation = await requireOwnedConversation(customerId, conversationId);
  if (!conversation) return { conversationId: null, messages: [] as never[] };

  const messages = await prisma.chatMessage.findMany({
    where: {
      conversationId: conversation.id,
      // 메시지 자체는 이전에 이미 보냈더라도, 연결된 주문(order)의 상태가 그 사이
      // 바뀌었다면(예: 결제 대기 → 결제완료) 다시 내려보내 카드가 최신 상태를
      // 반영하도록 합니다. 그렇지 않으면 이미 화면에 떠 있는 결제 카드가
      // 새로고침 전까지 낡은 상태로 남습니다.
      ...(after
        ? {
            OR: [
              { createdAt: { gt: after } },
              { order: { updatedAt: { gt: after } } },
              // 내(방문자)가 보낸 메시지를 관리자가 방금 읽었으면, 새 메시지가
              // 아니어도 다시 내려보내 "읽음" 표시가 실시간으로 뜨게 합니다.
              { sender: "VISITOR", read: true, updatedAt: { gt: after } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { order: { select: ORDER_SUMMARY_SELECT } },
  });

  // 방문자가 폴링하는 시점 = 화면을 보고 있다는 뜻이므로, 관리자가 보낸 메시지를 읽음 처리
  await prisma.chatMessage.updateMany({
    where: { conversationId: conversation.id, sender: "ADMIN", read: false },
    data: { read: true },
  });

  return { conversationId: conversation.id, messages: messages.map(decryptMessage) };
}

export async function getAdminConversationMessages(conversationId: string, after?: Date) {
  const messages = await prisma.chatMessage.findMany({
    where: {
      conversationId,
      ...(after
        ? {
            OR: [
              { createdAt: { gt: after } },
              { order: { updatedAt: { gt: after } } },
              // 내(관리자)가 보낸 메시지를 고객이 방금 읽었으면 다시 내려보내
              // "읽음" 표시가 실시간으로 뜨게 합니다.
              { sender: "ADMIN", read: true, updatedAt: { gt: after } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { order: { select: ORDER_SUMMARY_SELECT } },
  });

  await prisma.chatMessage.updateMany({
    where: { conversationId, sender: "VISITOR", read: false },
    data: { read: true },
  });

  return messages.map(decryptMessage);
}
