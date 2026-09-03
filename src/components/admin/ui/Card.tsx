import { cn } from "@/lib/utils";

export function AdminCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-admin-border bg-admin-surface p-4 shadow-[var(--shadow-e1)] sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  // compact: 세로 공간이 빠듯한 화면(채팅 상세 등)용 — 모바일에서 제목 축소 + 설명 숨김.
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 px-4 sm:px-8",
        compact ? "pt-4 sm:pt-8" : "pt-6 sm:pt-8"
      )}
    >
      <div className="min-w-0">
        <h1
          className={cn(
            "truncate font-semibold text-admin-text",
            compact ? "text-lg sm:text-2xl" : "text-2xl"
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "mt-1.5 truncate text-sm text-admin-muted",
              compact && "hidden sm:block"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
