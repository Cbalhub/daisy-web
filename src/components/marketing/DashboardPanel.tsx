// MOVD가 실제로 만들어 쓰는 관리자 대시보드의 UI 언어를 정적으로 재현한 패널.
// 가짜 브라우저 창틀·신호등 없이 제품 UI 그 자체만. 무채색 + 블루 포인트 하나.
// 숫자는 예시임이 드러나는 절제된 값만 씁니다.

const SPARK = [4, 5, 4, 7, 6, 8, 7, 10, 9, 8, 11, 10, 13, 12];
const BARS = [38, 52, 44, 61, 48, 70, 58];
const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

// Catmull-Rom → 부드러운 스플라인 경로.
function sparkPaths() {
  const w = 300;
  const h = 60;
  const max = Math.max(...SPARK);
  const min = Math.min(...SPARK);
  const pts = SPARK.map((v, i) => ({
    x: (i / (SPARK.length - 1)) * w,
    y: h - 3 - ((v - min) / (max - min || 1)) * (h - 10),
  }));
  let line = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    line += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return { line, area: `${line} L ${w} ${h} L 0 ${h} Z`, w, h, end: pts[pts.length - 1] };
}

const ORDERS = [
  { title: "카카오톡 상담 챗봇", meta: "정산 완료" },
  { title: "재고 동기화 자동화", meta: "작업 중" },
  { title: "정산 리포트 배치", meta: "입금 확인" },
];

export function DashboardPanel({ caption = false }: { caption?: boolean }) {
  const { line, area, w, h, end } = sparkPaths();

  return (
    <figure className="m-0 h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-e2)]">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <p className="text-[13px] font-semibold text-ink">관리자 대시보드</p>
          <span className="ml-auto rounded-md bg-paper-dim px-2 py-0.5 text-[11.5px] font-medium text-ink-soft">
            2026년 9월
          </span>
        </div>

        <div className="flex-1 overflow-hidden p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium text-ink-soft">결제 완료 금액</p>
              <p className="mt-1 font-display text-[30px] leading-none font-extrabold tracking-tight tabular-nums text-ink">
                ₩8,420,000
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-accent-soft px-2 py-1 text-[11.5px] font-bold text-accent">
              ▲ 12%
            </span>
          </div>

          <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-[52px] w-full" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="movd-spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent-bright)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--color-accent-bright)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#movd-spark)" />
            <path
              d={line}
              fill="none"
              stroke="var(--color-accent-bright)"
              strokeWidth="1.75"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={end.x} cy={end.y} r="3" fill="var(--color-accent-bright)" vectorEffect="non-scaling-stroke" />
          </svg>

          <div className="mt-4 border-t border-line pt-4">
            <div className="flex items-end gap-2">
              {BARS.map((v, i) => (
                <span
                  key={i}
                  className={`w-full rounded-[2px] ${i === BARS.length - 1 ? "bg-accent" : "bg-line"}`}
                  style={{ height: `${v}px` }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex gap-2 text-center text-[9.5px] text-muted">
              {DAYS.map((d) => (
                <span key={d} className="w-full">
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <p className="text-[12px] font-medium text-ink-soft">최근 주문</p>
            <ul className="mt-2.5 space-y-2.5">
              {ORDERS.map((o) => (
                <li key={o.title} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="truncate font-medium text-ink">{o.title}</span>
                  <span className="shrink-0 rounded-md bg-paper-dim px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                    {o.meta}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-xs text-muted">
          MOVD가 직접 만들어 쓰는 관리자 도구입니다. 이 사이트의 결제·정산도 여기서 돌아갑니다.
        </figcaption>
      )}
    </figure>
  );
}
