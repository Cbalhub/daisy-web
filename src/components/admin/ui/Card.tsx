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
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-4 pt-6 sm:px-4 sm:px-8 sm:pt-8">
      <div>
        <h1 className="text-2xl font-semibold text-admin-text">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-admin-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
