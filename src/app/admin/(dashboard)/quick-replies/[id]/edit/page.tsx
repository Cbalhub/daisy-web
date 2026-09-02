import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/ui/Card";
import { QuickReplyForm } from "@/components/admin/QuickReplyForm";

export const dynamic = "force-dynamic";

export default async function EditQuickReplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quickReply = await prisma.quickReply.findUnique({ where: { id } });
  if (!quickReply) notFound();

  return (
    <div className="pb-16">
      <AdminPageHeader title="빠른 답변 수정" />
      <div className="px-4 sm:px-8 pt-6">
        <div className="max-w-2xl">
          <QuickReplyForm initial={quickReply} />
        </div>
      </div>
    </div>
  );
}
