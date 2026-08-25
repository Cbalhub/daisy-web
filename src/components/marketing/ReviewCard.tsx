import type { Review } from "@prisma/client";
import { Card } from "@/components/ui/Card";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <svg width="28" height="20" viewBox="0 0 28 20" fill="none" className="text-accent">
          <path
            d="M0 20V11.4C0 4.9 3.9 0.8 10.6 0L11.5 3.2C7.4 4.2 5.4 6.7 5.1 9.6H10V20H0ZM16.5 20V11.4C16.5 4.9 20.4 0.8 27.1 0L28 3.2C23.9 4.2 21.9 6.7 21.6 9.6H26.5V20H16.5Z"
            fill="currentColor"
          />
        </svg>
        {review.rating && <StarRating value={review.rating} />}
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">{review.quote}</p>
      <div className="mt-6 border-t border-line pt-4">
        <p className="text-sm font-semibold">{review.company}</p>
        {review.role && <p className="text-xs text-muted">{review.role}</p>}
      </div>
    </Card>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`평점 5점 만점에 ${value}점`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 20 20" className="shrink-0">
          <path
            d="M10 2.5l2.3 4.9 5.2.6-3.9 3.6 1 5.2-4.6-2.6-4.6 2.6 1-5.2-3.9-3.6 5.2-.6L10 2.5Z"
            fill={i < value ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
            className={i < value ? "text-accent" : "text-line"}
          />
        </svg>
      ))}
    </div>
  );
}
