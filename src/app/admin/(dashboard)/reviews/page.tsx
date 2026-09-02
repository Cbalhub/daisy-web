import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { IconStar } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="고객 후기"
        description="공개 사이트 /reviews에 노출되는 후기를 관리합니다."
        action={
          <Link
            href="/admin/reviews/new"
            className="rounded-lg bg-admin-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            새 후기 추가
          </Link>
        }
      />

      <div className="px-4 sm:px-8 pt-6">
        <AdminCard className="p-0">
          {reviews.length === 0 ? (
            <AdminEmptyState
              icon={<IconStar className="h-6 w-6" />}
              title="아직 등록된 후기가 없습니다."
              description="고객 후기를 등록하면 홈페이지에 노출돼요."
            />
          ) : (
            <ul className="divide-y divide-admin-border">
              {reviews.map((review) => (
                <li key={review.id}>
                  <Link
                    href={`/admin/reviews/${review.id}/edit`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-admin-content"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-medium text-admin-text">{review.company}</p>
                        {review.orderId && (
                          <span className="shrink-0 rounded-full bg-admin-blue-soft px-2 py-0.5 text-[10px] font-medium text-admin-blue">
                            고객 제출
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-admin-muted">
                        {review.role ? `${review.role} · ` : ""}
                        {review.quote}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {review.rating && (
                        <span className="text-xs text-admin-amber">
                          {"★".repeat(review.rating)}
                          <span className="text-admin-muted">{"★".repeat(5 - review.rating)}</span>
                        </span>
                      )}
                      <AdminBadge tone={review.publishedAt ? "green" : "neutral"}>
                        {review.publishedAt ? "게시됨" : "비공개"}
                      </AdminBadge>
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
