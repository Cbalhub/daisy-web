import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";

export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
  className,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {kicker && (
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {kicker}
          </p>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.1}>
          <p className="mt-4 text-base leading-relaxed text-muted">
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
