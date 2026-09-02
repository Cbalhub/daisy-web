import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/ui/Card";
import { ReviewForm } from "@/components/admin/ReviewForm";

export const dynamic = "force-dynamic";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) notFound();

  return (
    <div className="pb-16">
      <AdminPageHeader title="후기 수정" />
      <div className="px-4 sm:px-8 pt-6">
        <div className="max-w-2xl">
          <ReviewForm
            initial={{
              id: review.id,
              company: review.company,
              role: review.role ?? "",
              quote: review.quote,
              rating: review.rating,
              order: review.order,
              published: Boolean(review.publishedAt),
            }}
          />
        </div>
      </div>
    </div>
  );
}
