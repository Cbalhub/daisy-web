import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChatPageView } from "@/components/chat/ChatPageView";
import { requireCustomerSession } from "@/lib/customer-auth";
import { listCustomerConversations, getOrCreateDefaultConversation } from "@/lib/chat";

export const metadata: Metadata = {
  title: "채팅",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: Date;
  lastMessagePreview: string | null;
  unreadCount: number;
};

export default async function ChatPage() {
  const session = await requireCustomerSession();
  if (!session?.customerId) redirect("/account/login?next=/chat");

  let conversations: ConversationSummary[] = await listCustomerConversations(session.customerId);
  if (conversations.length === 0) {
    const created = await getOrCreateDefaultConversation(session.customerId);
    conversations = [
      {
        id: created.id,
        title: created.title || "일반 문의",
        lastMessageAt: created.lastMessageAt,
        lastMessagePreview: null,
        unreadCount: 0,
      },
    ];
  }

  return (
    <ChatPageView
      initialConversations={conversations.map((c) => ({
        ...c,
        lastMessageAt: c.lastMessageAt.toISOString(),
      }))}
      initialConversationId={conversations[0].id}
    />
  );
}
