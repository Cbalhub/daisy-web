// 견적 공용 타입 + 순수 계산/포맷 함수. 클라이언트·서버 양쪽에서 씁니다.
// (Gemini 호출은 server-only 인 estimate.ts 에 별도로 있습니다.)

export type EstimateItem = { name: string; detail: string; days: number };
export type EstimateGroup = { name: string; note: string; items: EstimateItem[] };

export function normalizeGroups(input: unknown): EstimateGroup[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((g) => {
      const gg = (g ?? {}) as Record<string, unknown>;
      const items = Array.isArray(gg.items)
        ? gg.items
            .map((it) => {
              const ii = (it ?? {}) as Record<string, unknown>;
              const days = Number(ii.days);
              return {
                name: String(ii.name ?? "").trim().slice(0, 120),
                detail: String(ii.detail ?? "").trim().slice(0, 600),
                days: Number.isFinite(days) && days >= 0 ? Math.round(days * 2) / 2 : 0,
              };
            })
            .filter((it) => it.name)
        : [];
      return {
        name: String(gg.name ?? "").trim().slice(0, 120),
        note: String(gg.note ?? "").trim().slice(0, 600),
        items,
      };
    })
    .filter((g) => g.name && g.items.length > 0);
}

export function totalDays(groups: EstimateGroup[]): number {
  const sum = groups.reduce((a, g) => a + g.items.reduce((b, it) => b + (it.days || 0), 0), 0);
  return Math.round(sum * 2) / 2;
}

// 원 단위 표시. rate(일당)가 0이면 금액 계산을 하지 않습니다.
export function krw(n: number): string {
  return `₩${Math.round(n).toLocaleString("ko-KR")}`;
}
export function groupDays(g: EstimateGroup): number {
  return Math.round(g.items.reduce((a, it) => a + (it.days || 0), 0) * 2) / 2;
}

// 견적 초안 → 용역계약서 '용역 범위' 칸에 붙여넣을 여러 줄 텍스트.
// 금액은 계약서에서 따로 넣으므로 여기엔 작업일수만.
export function toScopeText(opts: {
  projectName: string;
  summary: string;
  groups: EstimateGroup[];
  notes: string;
  dailyRateKrw?: number;
}): string {
  const rate = opts.dailyRateKrw && opts.dailyRateKrw > 0 ? opts.dailyRateKrw : 0;
  const amt = (days: number) => (rate ? ` — ${krw(days * rate)}` : "");
  const lines: string[] = [];
  if (opts.summary.trim()) lines.push(opts.summary.trim(), "");

  for (const g of opts.groups) {
    const gDays = groupDays(g);
    lines.push(`■ ${g.name} (${fmtDays(gDays)}${amt(gDays)})`);
    for (const it of g.items) {
      lines.push(`  - ${it.name}${it.detail ? `: ${it.detail}` : ""} (${fmtDays(it.days)})`);
    }
    lines.push("");
  }

  const td = totalDays(opts.groups);
  lines.push(`합계: 약 ${fmtDays(td)}${amt(td)}`);
  if (rate) lines.push(`(기준 일당 ${krw(rate)} · 부가세 별도)`);
  if (opts.notes.trim()) {
    lines.push("", "[가정 및 제외 범위]", opts.notes.trim());
  }
  return lines.join("\n").trim();
}

function fmtDays(d: number): string {
  if (!d) return "산정 필요";
  return `${Number.isInteger(d) ? d : d.toFixed(1)}일`;
}
