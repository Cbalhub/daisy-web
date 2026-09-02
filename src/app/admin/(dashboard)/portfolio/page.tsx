import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { IconImage } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export default async function AdminPortfolioPage() {
  const items = await prisma.portfolioItem.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="포트폴리오"
        description="공개 사이트에 노출되는 포트폴리오 항목을 관리합니다."
        action={
          <Link
            href="/admin/portfolio/new"
            className="rounded-lg bg-admin-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            새 항목 추가
          </Link>
        }
      />

      <div className="px-4 sm:px-8 pt-6">
        <AdminCard className="p-0">
          {items.length === 0 ? (
            <AdminEmptyState
              icon={<IconImage className="h-6 w-6" />}
              title="아직 등록된 포트폴리오가 없습니다."
              description="작업물을 등록하면 홈페이지 포트폴리오에 노출돼요."
            />
          ) : (
            <ul className="divide-y divide-admin-border">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/admin/portfolio/${item.id}/edit`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-admin-content"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {item.images[0] ? (
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-admin-border">
                          <Image src={item.images[0]} alt="" fill sizes="44px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-11 w-11 shrink-0 rounded-lg border border-dashed border-admin-border" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-admin-text">{item.title}</p>
                        <p className="mt-0.5 text-xs text-admin-muted">
                          {item.category} · /{item.slug}
                        </p>
                      </div>
                    </div>
                    <AdminBadge tone={item.publishedAt ? "green" : "neutral"}>
                      {item.publishedAt ? "게시됨" : "비공개"}
                    </AdminBadge>
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
