// MOVD가 실제로 만들어 쓰는 관리자 대시보드의 UI 언어를 정적으로 재현한 패널.
// 가짜 브라우저 창틀·신호등 없이 제품 UI 그 자체만. 무채색 + 블루 포인트 하나.
// 숫자는 예시임이 드러나는 절제된 값만 씁니다.

const SPARK = [4, 5, 4, 7, 6, 8, 7, 10, 9, 8, 11, 10, 13, 12];
const BARS = [38, 52, 44, 61, 48, 70, 58];

function sparkPaths() {
  const w = 300;
  const h = 64;
  const max = Math.max(...SPARK);
  const pts = SPARK.map((v, i) => ({
    x: (i / (SPARK.length - 1)) * w,
    y: h - 4 - (v / max) * (h - 12),
  }));
  let line = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    line += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${(pts[i].y + pts[i + 1].y) / 2}`;
  }
  line += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  return { line, area: `${line} L ${w} ${h} L 0 ${h} Z`, w, h };
}

const ORDERS = [
  { title: "카카오톡 상담 챗봇", meta: "정산 완료" },
  { title: "재고 동기화 자동화", meta: "작업 중" },
  { title: "정산 리포트 배치", meta: "입금 확인" },
];

export function DashboardPanel({ caption = false }: { caption?: boolean }) {
  const { line, area, w, h } = sparkPaths();

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-e2)]">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <p className="text-[13px] font-semibold text-ink">관리자 대시보드</p>
          <span className="ml-auto rounded-md bg-paper-dim px-2 py-0.5 text-[12px] font-medium text-ink-soft">
            이번 달
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium text-ink-soft">결제 완료 금액</p>
              <p className="mt-1 font-display text-[30px] font-extrabold tracking-tight tabular-nums text-ink">
                ₩8,420,000
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-accent-soft px-2 py-1 text-[12px] font-bold text-accent">
              ▲ 12%
            </span>
          </div>

          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="mt-3 h-14 w-full"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path d={area} fill="var(--color-accent-bright)" opacity="0.12" />
            <path
              d={line}
              fill="none"
              stroke="var(--color-accent-bright)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <div className="mt-4 flex items-end gap-1.5 border-t border-line pt-4">
            {BARS.map((v, i) => (
              <span
                key={i}
                className={`w-full rounded-t-[3px] ${i === BARS.length - 1 ? "bg-accent" : "bg-line"}`}
                style={{ height: `${v}px` }}
              />
            ))}
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
