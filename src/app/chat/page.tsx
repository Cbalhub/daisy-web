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

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const session = await requireCustomerSession();
  if (!session?.customerId) redirect("/account/login?next=/chat");

  const { new: isNew } = await searchParams;
  const conversations: ConversationSummary[] = await listCustomerConversations(session.customerId);

  // 새 프로젝트 문의를 시작할 때(첫 방문이거나 "새 프로젝트 문의" 클릭) 문의 폼을
  // 먼저 보여줍니다. 보내면 대화가 만들어지고 이 페이지가 다시 로드돼 채팅 화면으로.
  if (conversations.length === 0 || isNew === "1") {
    return <PreChatForm hasExisting={conversations.length > 0} />;
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
