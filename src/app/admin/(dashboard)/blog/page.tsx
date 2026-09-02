import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { IconEdit } from "@/components/admin/icons";
import { AddBlogDraft } from "@/components/admin/BlogDraft";
import { BLOG_PLATFORM_LABEL } from "@/lib/admin/blog-labels";

export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminBlogPage() {
  const drafts = await prisma.blogDraft.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="블로그 초안"
        description="주제를 넣으면 Claude 가 SEO 블로그 글 초안을 씁니다. 검토·수정한 뒤 복사해서 네이버 블로그·티스토리에 붙여넣으세요."
      />

      <div className="px-8 pt-6">
        <AddBlogDraft />
      </div>

      <div className="px-8 pt-6">
        {drafts.length === 0 ? (
          <AdminCard className="p-0">
            <AdminEmptyState icon={<IconEdit className="h-6 w-6" />} title="아직 초안이 없습니다." />
          </AdminCard>
        ) : (
          <ul className="space-y-2">
            {drafts.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/admin/blog/${d.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-admin-border bg-admin-surface px-5 py-4 transition-colors hover:border-admin-blue"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-admin-text">
                      {d.title || d.topic}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-admin-muted">{d.topic}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-admin-muted">
                    <AdminBadge tone="neutral">{BLOG_PLATFORM_LABEL[d.platform]}</AdminBadge>
                    {DATE_FORMAT.format(d.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
