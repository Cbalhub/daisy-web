import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-admin-bg-soft text-admin-muted",
  blue: "bg-admin-blue-soft text-admin-blue",
  green: "bg-admin-green-soft text-admin-green",
  amber: "bg-admin-amber-soft text-admin-amber",
  red: "bg-admin-red-soft text-admin-red",
};

export function AdminBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
