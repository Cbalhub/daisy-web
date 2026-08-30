"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, PROJECT_STAGE_LABEL, PROJECT_STAGE_ORDER } from "@/lib/admin/status";
import type { Order, ProjectStage } from "@prisma/client";

type OrderWithReview = Order & { review: { id: string } | null };

const TONE_TEXT: Record<string, string> = {
  neutral: "bg-paper-dim text-muted",
  blue: "bg-accent-soft text-accent",
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  red: "bg-error-soft text-error",
};

export function OrderList({ orders }: { orders: OrderWithReview[] }) {
  return (
    <ul className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </ul>
  );
}

function OrderRow({ order }: { order: OrderWithReview }) {
  const [open, setOpen] = useState(false);
  // 결제가 끝나야 실제 작업 진행 단계가 의미가 있으므로, 결제완료 건만 펼쳐서
  // 진행 상황을 보여줍니다.
  const expandable = order.status === "PAID";

  return (
    <li>
      <div
        className={cn("flex flex-wrap items-center justify-between gap-3 p-5", expandable && "cursor-pointer")}
        onClick={() => expandable && setOpen((v) => !v)}
      >
        <div className="min-w-0">
          <p className="text-xs text-muted">{order.invoiceNumber}</p>
          <p className="mt-0.5 font-medium">{order.title}</p>
          <p className="mt-0.5 text-sm tabular-nums text-muted">₩{order.amount.toLocaleString("ko-KR")}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              // 결제가 끝난 뒤에는 "결제 완료"보다 실제 작업이 어디까지 왔는지가
              // 더 중요한 정보라, 배지 자체를 진행 단계로 바꿔서 보여줍니다.
              expandable
                ? TONE_TEXT[PROJECT_STAGE_LABEL[order.progressStage].tone]
                : TONE_TEXT[ORDER_STATUS_LABEL[order.status].tone]
            )}
          >
            {expandable
              ? PROJECT_STAGE_LABEL[order.progressStage].label
              : ORDER_STATUS_LABEL[order.status].label}
          </span>
          {(order.status === "DRAFT" || order.status === "PENDING") && (
            <Link
              href={`/pay/${order.orderToken}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-accent hover:opacity-70"
            >
              결제하기 &rarr;
            </Link>
          )}
          {expandable && (
            <Link
              href={`/pay/${order.orderToken}/receipt`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-accent hover:opacity-70"
            >
              영수증
            </Link>
          )}
          {order.progressStage === "DELIVERED" && !order.review && (
            <Link
              href={`/review/${order.orderToken}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-accent hover:opacity-70"
            >
              후기 남기기
            </Link>
          )}
          {expandable && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className={cn("shrink-0 text-muted transition-transform duration-200", open && "rotate-180")}
            >
              <path
                d="M3 5.5L7 9.5L11 5.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <ProgressTracker stage={order.progressStage} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function ProgressTracker({ stage }: { stage: ProjectStage }) {
  const currentIndex = PROJECT_STAGE_ORDER.indexOf(stage);
  return (
    <div className="flex items-center gap-2 rounded-xl bg-paper-dim px-4 py-5">
      {PROJECT_STAGE_ORDER.map((s, i) => {
        const done = i <= currentIndex;
        const lineFilled = i < currentIndex;
        return (
          <div key={s} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4, delay: i * 0.1 }}
                className={cn("h-2.5 w-2.5 rounded-full", done ? "bg-accent" : "bg-line")}
              />
              <motion.span
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 + 0.05 }}
                className={cn("text-[11px] whitespace-nowrap", done ? "font-medium text-ink" : "text-muted")}
              >
                {PROJECT_STAGE_LABEL[s].label}
              </motion.span>
            </div>
            {i < PROJECT_STAGE_ORDER.length - 1 && (
              <div className="relative h-px flex-1 bg-line">
                {lineFilled && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.1 + 0.15, ease: "easeOut" }}
                    style={{ transformOrigin: "left" }}
                    className="absolute inset-0 bg-accent"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
