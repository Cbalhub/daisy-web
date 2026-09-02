import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { SearchBox } from "@/components/admin/ui/SearchBox";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { IconChat } from "@/components/admin/icons";
import { decryptFieldTagged } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export default async function AdminChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const conversations = await prisma.chatConversation.findMany({
    where: query
      ? {
          customer: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        }
      : undefined,
    orderBy: { lastMessageAt: "desc" },
    include: {
      customer: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { sender: "VISITOR", read: false } } } },
    },
    take: 100,
  });

  return (
    <div className="pb-16">
      <AdminPageHeader title="채팅" description="사이트 방문자와의 실시간 채팅 목록입니다." />

      <div className="px-4 sm:px-8 pt-6">
        <SearchBox placeholder="고객 이름, 이메일로 검색" />
      </div>

      <div className="px-4 sm:px-8 pt-4">
        <AdminCard className="p-0">
          {conversations.length === 0 ? (
            <AdminEmptyState
              icon={<IconChat className="h-6 w-6" />}
              title={query ? `"${query}"에 해당하는 대화가 없습니다.` : "아직 채팅이 없습니다."}
              description={query ? undefined : "방문자가 채팅을 시작하면 여기에 표시돼요."}
            />
          ) : (
            <ul className="divide-y divide-admin-border">
              {conversations.map((c) => {
                const unread = c._count.messages;
                const last = c.messages[0];
                return (
                  <li key={c.id}>
                    <Link
                      href={`/admin/chats/${c.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-admin-content"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-medium text-admin-text">
                            {c.customer.name || c.customer.email}
                          </p>
                          {c.title && (
                            <span className="shrink-0 rounded-full bg-admin-content px-2 py-0.5 text-[11px] font-medium text-admin-muted">
                              {c.title}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-admin-muted">
                          {last
                            ? `${last.sender === "ADMIN" ? "나: " : ""}${decryptFieldTagged(last.body)}`
                            : "메시지 없음"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-admin-muted">
                          {new Intl.DateTimeFormat("ko-KR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(c.lastMessageAt)}
                        </span>
                        {unread > 0 && <AdminBadge tone="blue">{unread}개 안읽음</AdminBadge>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
