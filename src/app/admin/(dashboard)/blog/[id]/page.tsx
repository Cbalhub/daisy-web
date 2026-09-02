import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/ui/Card";
import { IconChevronLeft } from "@/components/admin/icons";
import { BlogDraftEditor } from "@/components/admin/BlogDraft";
import { BLOG_PLATFORM_LABEL } from "@/lib/admin/blog-labels";

export const dynamic = "force-dynamic";

export default async function BlogDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draft = await prisma.blogDraft.findUnique({ where: { id } });
  if (!draft) notFound();

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="초안 편집"
        description={`${BLOG_PLATFORM_LABEL[draft.platform]} · ${draft.tone}`}
      />
      <div className="px-8 pt-4">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1 text-xs text-admin-muted transition-colors hover:text-admin-text"
        >
          <IconChevronLeft className="h-3.5 w-3.5" />
          초안 목록
        </Link>
      </div>
      <div className="px-8 pt-4">
        <BlogDraftEditor
          draft={{
            id: draft.id,
            title: draft.title,
            body: draft.body,
            topic: draft.topic,
            model: draft.model,
          }}
        />
      </div>
    </div>
  );
}
