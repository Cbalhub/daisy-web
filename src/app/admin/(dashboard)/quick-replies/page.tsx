import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { IconBolt } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export default async function AdminQuickRepliesPage() {
  const quickReplies = await prisma.quickReply.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="빠른 답변"
        description="채팅에서 자주 쓰는 문구를 버튼 한 번으로 불러올 수 있게 만듭니다."
        action={
          <Link
            href="/admin/quick-replies/new"
            className="rounded-lg bg-admin-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            새 빠른 답변 추가
          </Link>
        }
      />

      <div className="px-4 sm:px-8 pt-6">
        <AdminCard className="p-0">
          {quickReplies.length === 0 ? (
            <AdminEmptyState
              icon={<IconBolt className="h-6 w-6" />}
              title="아직 등록된 빠른 답변이 없습니다."
              description="자주 쓰는 답변을 등록하면 채팅에서 바로 불러올 수 있어요."
            />
          ) : (
            <ul className="divide-y divide-admin-border">
              {quickReplies.map((qr) => (
                <li key={qr.id}>
                  <Link
                    href={`/admin/quick-replies/${qr.id}/edit`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-admin-content"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-admin-text">{qr.label}</p>
                      <p className="mt-0.5 truncate text-xs text-admin-muted">{qr.body}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
