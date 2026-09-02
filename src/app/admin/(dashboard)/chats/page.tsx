import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { SearchBox } from "@/components/admin/ui/SearchBox";
import { Segmented } from "@/components/admin/ui/Segmented";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { IconChat } from "@/components/admin/icons";
import { ChatsListView } from "@/components/admin/ChatsListView";
import { decryptFieldTagged } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export default async function AdminChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const query = q?.trim();
  const statusFilter = status === "OPEN" || status === "CLOSED" ? status : undefined;

  const conversations = await prisma.chatConversation.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(query
        ? {
            customer: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      customer: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { sender: "VISITOR", read: false } } } },
    },
    take: 100,
  });

  const base = "/admin/chats";
  const activeHref = statusFilter ? `${base}?status=${statusFilter}` : base;

  return (
    <div className="pb-16">
      <AdminPageHeader title="채팅" description="사이트 방문자와의 실시간 채팅 목록입니다." />

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 pt-6">
        <Segmented
          active={activeHref}
          items={[
            { label: "전체", href: base },
            { label: "진행중", href: `${base}?status=OPEN` },
            { label: "닫힘", href: `${base}?status=CLOSED` },
          ]}
        />
        <SearchBox placeholder="고객 이름, 이메일로 검색" />
      </div>

      <div className="px-4 sm:px-8 pt-4">
        {conversations.length === 0 ? (
          <AdminCard className="p-0">
            <AdminEmptyState
              icon={<IconChat className="h-6 w-6" />}
              title={query ? `"${query}"에 해당하는 대화가 없습니다.` : "아직 채팅이 없습니다."}
              description={query ? undefined : "방문자가 채팅을 시작하면 여기에 표시돼요."}
            />
          </AdminCard>
        ) : (
          <ChatsListView
            conversations={conversations.map((c) => {
              const last = c.messages[0];
              return {
                id: c.id,
                name: c.customer.name || c.customer.email,
                title: c.title,
                preview: last
                  ? `${last.sender === "ADMIN" ? "나: " : ""}${decryptFieldTagged(last.body)}`
                  : "메시지 없음",
                unread: c._count.messages,
                status: c.status,
                lastMessageAt: c.lastMessageAt.toISOString(),
              };
            })}
          />
        )}
      </div>
    </div>
  );
}
