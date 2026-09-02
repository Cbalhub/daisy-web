import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminEmptyState } from "@/components/admin/ui/EmptyState";
import { Segmented } from "@/components/admin/ui/Segmented";
import { SearchBox } from "@/components/admin/ui/SearchBox";
import { DateRangeFilter } from "@/components/admin/ui/DateRangeFilter";
import { IconMail } from "@/components/admin/icons";
import { InquiriesView } from "@/components/admin/InquiriesView";
import type { InquiryStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: { label: string; status?: InquiryStatus }[] = [
  { label: "전체" },
  { label: "신규", status: "NEW" },
  { label: "연락함", status: "CONTACTED" },
  { label: "가망", status: "QUALIFIED" },
  { label: "종료", status: "CLOSED" },
];

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string }>;
}) {
  const { status, q, from, to } = await searchParams;
  const query = q?.trim();
  const fromDate = from ? new Date(`${from}T00:00:00`) : undefined;
  const toDate = to ? new Date(`${to}T23:59:59.999`) : undefined;

  const where: Prisma.InquiryWhereInput = {
    ...(status && ["NEW", "CONTACTED", "QUALIFIED", "CLOSED"].includes(status)
      ? { status: status as InquiryStatus }
      : {}),
    ...(fromDate || toDate
      ? { createdAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
      : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { message: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const inquiries = await prisma.inquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { conversation: { select: { id: true } } },
  });

  const base = "/admin/inquiries";
  const activeHref = status ? `${base}?status=${status}` : base;

  return (
    <div className="pb-16">
      <AdminPageHeader title="문의" description="채팅 진입 전 문의 폼으로 들어온 요청입니다." />

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 pt-6">
        <Segmented
          active={activeHref}
          items={STATUS_FILTERS.map((f) => ({
            label: f.label,
            href: f.status ? `${base}?status=${f.status}` : base,
          }))}
        />
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter />
          <SearchBox placeholder="이름, 이메일, 내용으로 검색" />
        </div>
      </div>

      <div className="px-4 sm:px-8 pt-4">
        {inquiries.length === 0 ? (
          <AdminCard className="p-0">
            <AdminEmptyState
              icon={<IconMail className="h-6 w-6" />}
              title={query ? `"${query}"에 해당하는 문의가 없습니다.` : "아직 문의가 없습니다."}
            />
          </AdminCard>
        ) : (
          <InquiriesView
            inquiries={inquiries.map((i) => ({
              id: i.id,
              name: i.name,
              email: i.email,
              budget: i.budget,
              preferredTimeline: i.preferredTimeline,
              message: i.message,
              status: i.status,
              hasAttachment: Boolean(i.attachmentUrl),
              attachmentUrl: i.attachmentUrl,
              conversationId: i.conversation?.id ?? null,
              createdAt: i.createdAt.toISOString(),
            }))}
          />
        )}
      </div>
    </div>
  );
}
