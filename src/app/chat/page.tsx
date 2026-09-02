import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChatPageView } from "@/components/chat/ChatPageView";
import { PreChatForm } from "@/components/chat/PreChatForm";
import { requireCustomerSession } from "@/lib/customer-auth";
import { listCustomerConversations } from "@/lib/chat";

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

  const conversations: ConversationSummary[] = await listCustomerConversations(session.customerId);

  // 대화가 하나도 없는 첫 방문이면 문의 폼을 먼저 보여줍니다. 제출(또는 "그냥
  // 채팅으로")하면 대화가 만들어지고 이 페이지가 다시 로드돼 채팅 화면으로.
  if (conversations.length === 0) {
    return <PreChatForm />;
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
