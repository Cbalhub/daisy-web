import type { Review } from "@prisma/client";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="flex h-full flex-col border-t border-line pt-6">
      {review.rating != null && <Stars value={review.rating} />}
      <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink">
        &ldquo;{review.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-5 text-sm">
        <span className="font-semibold">{review.company}</span>
        {review.role && <span className="text-muted"> · {review.role}</span>}
      </figcaption>
    </figure>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`평점 5점 만점에 ${value}점`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 20 20" className="shrink-0" aria-hidden>
          <path
            d="M10 2.5l2.3 4.9 5.2.6-3.9 3.6 1 5.2-4.6-2.6-4.6 2.6 1-5.2-3.9-3.6 5.2-.6L10 2.5Z"
            fill={i < value ? "var(--color-accent)" : "none"}
            stroke={i < value ? "var(--color-accent)" : "var(--color-line)"}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}
