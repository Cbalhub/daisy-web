import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminPageHeader } from "@/components/admin/ui/Card";
import { AdminBadge } from "@/components/admin/ui/Badge";
import { NewConversationButton } from "@/components/admin/NewConversationButton";
import { ORDER_STATUS_LABEL, INQUIRY_STATUS_LABEL } from "@/lib/admin/status";
import { decryptFieldTagged } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
      inquiries: { orderBy: { createdAt: "desc" } },
      chatConversations: {
        orderBy: { lastMessageAt: "desc" },
        include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!customer) notFound();

  return (
    <div className="pb-16">
      <AdminPageHeader
        title={customer.name || customer.email}
        description={`${customer.email}${customer.phone ? ` · ${customer.phone}` : ""} · ${new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(customer.createdAt)} 가입`}
      />

      <div className="px-4 sm:px-8 pt-6">
        <AdminCard className="p-0">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <h2 className="text-sm font-semibold text-admin-text">
              채팅 · 프로젝트별로 대화창이 하나씩 분리돼요
            </h2>
            <NewConversationButton customerId={customer.id} />
          </div>
          {customer.chatConversations.length === 0 ? (
            <p className="py-10 text-center text-sm text-admin-muted">아직 대화가 없습니다.</p>
          ) : (
            <ul className="mt-3 divide-y divide-admin-border">
              {customer.chatConversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/chats/${c.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-admin-content"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-admin-text">{c.title || "일반 문의"}</p>
                      <p className="mt-0.5 truncate text-xs text-admin-muted">
                        {c.messages[0] ? decryptFieldTagged(c.messages[0].body) : "메시지 없음"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-admin-muted">
                      {new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(
                        c.lastMessageAt
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <div className="px-4 sm:px-8 pt-4">
        <AdminCard className="p-0">
          <h2 className="px-5 pt-5 text-sm font-semibold text-admin-text">주문 · 결제</h2>
          {customer.orders.length === 0 ? (
            <p className="py-10 text-center text-sm text-admin-muted">주문 내역이 없습니다.</p>
          ) : (
            <ul className="mt-3 divide-y divide-admin-border">
              {customer.orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-admin-content"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-admin-muted">{order.invoiceNumber}</p>
                      <p className="mt-0.5 font-medium text-admin-text">{order.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-admin-text">
                        ₩{order.amount.toLocaleString("ko-KR")}
                      </span>
                      <AdminBadge tone={ORDER_STATUS_LABEL[order.status].tone}>
                        {ORDER_STATUS_LABEL[order.status].label}
                      </AdminBadge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <div className="px-4 sm:px-8 pt-4">
        <AdminCard className="p-0">
          <h2 className="px-5 pt-5 text-sm font-semibold text-admin-text">문의</h2>
          {customer.inquiries.length === 0 ? (
            <p className="py-10 text-center text-sm text-admin-muted">문의 내역이 없습니다.</p>
          ) : (
            <ul className="mt-3 divide-y divide-admin-border">
              {customer.inquiries.map((inquiry) => (
                <li key={inquiry.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {inquiry.budget && <AdminBadge tone="neutral">예산 {inquiry.budget}</AdminBadge>}
                      {inquiry.preferredTimeline && (
                        <AdminBadge tone="neutral">일정 {inquiry.preferredTimeline}</AdminBadge>
                      )}
                      {inquiry.attachmentUrl && (
                        <a
                          href={inquiry.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-admin-blue hover:underline"
                        >
                          📎 첨부
                        </a>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-admin-text">
                      {inquiry.message}
                    </p>
                  </div>
                  <AdminBadge tone={INQUIRY_STATUS_LABEL[inquiry.status].tone}>
                    {INQUIRY_STATUS_LABEL[inquiry.status].label}
                  </AdminBadge>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
