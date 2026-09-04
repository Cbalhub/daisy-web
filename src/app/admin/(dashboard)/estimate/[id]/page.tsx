import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/ui/Card";
import { IconChevronLeft } from "@/components/admin/icons";
import { EstimateEditor } from "@/components/admin/Estimate";
import { normalizeGroups } from "@/lib/estimate-format";

export const dynamic = "force-dynamic";

export default async function EstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const estimate = await prisma.estimate.findUnique({ where: { id } });
  if (!estimate) notFound();

  return (
    <div className="pb-16">
      <AdminPageHeader title="견적 편집" description="항목·작업일수를 조정한 뒤 저장하세요. 금액은 계약서에서 넣습니다." />
      <div className="px-4 pt-4 sm:px-8">
        <Link
          href="/admin/estimate"
          className="inline-flex items-center gap-1 text-xs text-admin-muted transition-colors hover:text-admin-text"
        >
          <IconChevronLeft className="h-3.5 w-3.5" />
          견적 목록
        </Link>
      </div>
      <div className="px-4 pt-4 sm:px-8">
        <EstimateEditor
          draft={{
            id: estimate.id,
            projectName: estimate.projectName,
            summary: estimate.summary,
            notes: estimate.notes,
            groups: normalizeGroups(estimate.groups),
            model: estimate.model,
            sourceText: estimate.sourceText,
          }}
        />
      </div>
    </div>
  );
}
