import Link from "next/link";
import { cn } from "@/lib/utils";

export function Segmented({
  items,
  active,
}: {
  items: { label: string; href: string; count?: number }[];
  active: string;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-admin-content p-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150",
            active === item.href
              ? "bg-admin-surface text-admin-text shadow-sm"
              : "text-admin-muted hover:text-admin-text"
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="ml-1 text-admin-muted">{item.count}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
