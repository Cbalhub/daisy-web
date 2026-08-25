import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/ui/Card";
import { PortfolioForm } from "@/components/admin/PortfolioForm";

export const dynamic = "force-dynamic";

export default async function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.portfolioItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="pb-16">
      <AdminPageHeader title="포트폴리오 수정" />
      <div className="px-8 pt-6">
        <div className="max-w-3xl">
          <PortfolioForm
            initial={{
              id: item.id,
              title: item.title,
              slug: item.slug,
              category: item.category,
              summary: item.summary,
              body: item.body,
              tags: item.tags,
              industry: item.industry ?? "",
              features: item.features,
              duration: item.duration ?? "",
              cost: item.cost ?? "",
              images: item.images,
              published: Boolean(item.publishedAt),
            }}
          />
        </div>
      </div>
    </div>
  );
}
