import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { ChatThread } from "@/components/admin/ChatThread";
import { decryptFieldTagged } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export default async function AdminChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          order: {
            select: {
              id: true,
              orderToken: true,
              title: true,
              amount: true,
              currency: true,
              status: true,
              progressStage: true,
            },
          },
        },
      },
    },
  });
  if (!conversation) notFound();

  // 관리자가 대화를 열람하는 시점에 방문자 메시지를 읽음 처리합니다.
  await prisma.chatMessage.updateMany({
    where: { conversationId: id, sender: "VISITOR", read: false },
    data: { read: true },
  });

  // 결제가 끝난 주문만 진행 상황을 업데이트할 대상으로 고를 수 있습니다.
  const payableProgressOrders = await prisma.order.findMany({
    where: { customerId: conversation.customer.id, status: "PAID" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, progressStage: true },
  });

  const quickReplies = await prisma.quickReply.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: { id: true, label: true, body: true },
  });

  // 같은 고객의 다른 프로젝트 대화들 — 대화 하나가 프로젝트 하나에 대응하므로,
  // 관리자가 이 고객의 다른 대화로 바로 넘어갈 수 있게 탭으로 보여줍니다.
  const siblingConversations = await prisma.chatConversation.findMany({
    where: { customerId: conversation.customer.id },
    orderBy: { lastMessageAt: "desc" },
    select: { id: true, title: true },
  });

  return (
    <div className="flex h-full flex-col pb-4">
      <AdminPageHeader
        title={conversation.customer.name || conversation.customer.email}
        description={conversation.customer.email}
      />
      <div className="min-h-0 flex-1 px-4 sm:px-8 pt-6">
        <div className="mx-auto h-full max-w-4xl">
          <AdminCard className="flex h-full flex-col">
            <ChatThread
              conversationId={conversation.id}
              conversationTitle={conversation.title || "일반 문의"}
              siblings={siblingConversations.map((c) => ({
                id: c.id,
                title: c.title || "일반 문의",
              }))}
              orders={payableProgressOrders}
              quickReplies={quickReplies}
              initialMessages={conversation.messages.map((m) => ({
                ...m,
                body: decryptFieldTagged(m.body),
                createdAt: m.createdAt.toISOString(),
              }))}
            />
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
