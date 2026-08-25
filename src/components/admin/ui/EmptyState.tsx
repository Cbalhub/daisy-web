import { Reveal } from "@/components/ui/Reveal";

export function AdminEmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Reveal>
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-admin-content text-admin-muted">
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium text-admin-text">{title}</p>
          {description && <p className="mt-1 text-xs text-admin-muted">{description}</p>}
        </div>
      </div>
    </Reveal>
  );
}
