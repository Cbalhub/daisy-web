import type { TimelineEvent } from "@/lib/order-timeline";

const FMT = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// 서버 컴포넌트 — 순수 표시. events 는 시간 오름차순.
export function OrderTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return null;
  return (
    <ol className="mt-4 space-y-0">
      {events.map((e, i) => {
        const last = i === events.length - 1;
        return (
          <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={
                  last
                    ? "mt-1 h-2 w-2 rounded-full bg-accent ring-4 ring-accent/15"
                    : "mt-1 h-2 w-2 rounded-full bg-line"
                }
              />
              {!last && <span className="w-px flex-1 bg-line" />}
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-sm font-medium text-ink">{e.label}</p>
              {e.detail && (
                <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-ink-soft">
                  {e.detail}
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-muted">{FMT.format(e.at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
