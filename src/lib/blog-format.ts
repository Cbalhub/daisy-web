// 블로그 초안 본문(마크다운-ish) → 플랫폼별 붙여넣기/발행용 텍스트.
// 편집기의 "복사" 버튼과 발행 대기열 API(/api/publish/queue) 양쪽에서 씁니다.

// AI 초안에 홍보/영업 문구가 섞여 나오는 경우를 걸러냅니다. 프롬프트에서 금지해도
// 모델이 마지막에 "저희 OOO는…" 같은 문단을 붙이는 일이 잦아, 발행·복사 직전에
// 자사명·상담 유도가 든 문단(과 그 소제목)을 통째로 제거합니다.
// 홍보는 편집기의 CTA 한 줄로만 통제합니다.
const BRAND_RE = /\b(MOVD|무브드)\b/i;
const SOLICIT_RE =
  /(상담\s*(문의|신청|받)|문의\s*(주세요|바랍니다|하세요|주시면)|견적\s*문의|무료\s*상담|지금\s*(문의|연락|상담)|카톡\s*채널|연락\s*주세요|합리적인\s*가격에\s*(제공|진행))/;

function isPromoBlock(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (BRAND_RE.test(t)) return true;
  // 자사명이 없어도 "대표가 직접 상담~진행" 같은 1인 개발 영업 클리셰 + 유도 문구
  if (SOLICIT_RE.test(t) && /(대표|저희|우리\s*팀|당사|직접\s*진행|책임지고)/.test(t)) return true;
  return false;
}

export function stripPromo(body: string): string {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  // 소제목(## … / ■ …) 기준으로 섹션을 나눔.
  type Section = { heading: string | null; body: string[] };
  const sections: Section[] = [{ heading: null, body: [] }];
  for (const line of lines) {
    if (/^\s*(#{1,6}\s+|■\s+)/.test(line)) sections.push({ heading: line, body: [] });
    else sections[sections.length - 1].body.push(line);
  }
  const kept = sections.filter((s) => {
    const whole = [s.heading ?? "", ...s.body].join("\n");
    return !isPromoBlock(whole);
  });
  // 남은 섹션에서도 홍보 문단(빈 줄로 구분)만 개별 제거.
  const out: string[] = [];
  for (const s of kept) {
    if (s.heading) out.push(s.heading);
    const paras = s.body.join("\n").split(/\n{2,}/);
    out.push(paras.filter((p) => !isPromoBlock(p)).join("\n\n"));
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// 네이버 블로그용 — 네이버 에디터는 마크다운을 렌더링하지 않으므로 기호를 제거하고
// 소제목·목록을 사람이 읽는 형태로 바꿉니다.
export function toPlainText(body: string): string {
  return stripPromo(body)
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*■\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "· ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .trim();
}

// 티스토리용 — 마크다운 그대로(홍보만 제거).
export function toMarkdown(body: string): string {
  return stripPromo(body);
}
