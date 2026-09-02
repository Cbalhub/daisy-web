// 블로그 초안의 기본적인 온페이지 SEO 점검. 순수 함수 — 편집 화면에서 실시간으로
// 돌려 체크리스트 + 대략적인 점수(0~100)를 보여줍니다. 검색엔진 실제 점수가 아니라
// "빠지기 쉬운 것"을 잡아주는 용도입니다.

export type SeoCheck = {
  label: string;
  status: "ok" | "warn" | "bad";
  detail: string;
};

export type SeoResult = { score: number; checks: SeoCheck[] };

// 공백 포함 글자 수 (한글 기준 체감 분량).
function charLen(s: string): number {
  return s.replace(/\r/g, "").length;
}

function stripMarkup(s: string): string {
  return s
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*■]\s+/gm, "")
    .replace(/[*`>]/g, "");
}

export function analyzeSeo(input: {
  title: string;
  body: string;
  metaDescription: string;
  tags: string[];
  keywords: string[];
}): SeoResult {
  const title = input.title.trim();
  const bodyPlain = stripMarkup(input.body).trim();
  const meta = input.metaDescription.trim();
  const primary = (input.keywords[0] ?? "").trim().toLowerCase();
  const firstPara = bodyPlain.split(/\n\s*\n/)[0] ?? "";
  const headings = input.body.match(/^(?:#{2,6}\s+|■\s+).+$/gm) ?? [];
  const paras = bodyPlain.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const longParas = paras.filter((p) => charLen(p) > 450).length;

  const checks: SeoCheck[] = [];
  const has = (hay: string, needle: string) =>
    needle.length > 0 && hay.toLowerCase().includes(needle);

  // 제목
  const tLen = charLen(title);
  checks.push({
    label: "제목 길이",
    status: tLen === 0 ? "bad" : tLen >= 25 && tLen <= 45 ? "ok" : "warn",
    detail:
      tLen === 0 ? "제목이 없습니다" : `${tLen}자 (검색결과 잘림 없이 25~45자 권장)`,
  });
  checks.push({
    label: "제목에 핵심 키워드",
    status: !primary ? "warn" : has(title, primary) ? "ok" : "bad",
    detail: !primary
      ? "핵심 키워드가 지정되지 않음"
      : has(title, primary)
        ? `"${input.keywords[0]}" 포함`
        : `"${input.keywords[0]}"를 제목 앞쪽에 넣어보세요`,
  });

  // 메타 설명
  const mLen = charLen(meta);
  checks.push({
    label: "메타 설명 길이",
    status: mLen === 0 ? "bad" : mLen >= 60 && mLen <= 120 ? "ok" : "warn",
    detail:
      mLen === 0 ? "메타 설명이 비어 있음" : `${mLen}자 (70~110자 권장)`,
  });

  // 첫 문단 키워드
  checks.push({
    label: "첫 문단에 키워드",
    status: !primary ? "warn" : has(firstPara, primary) ? "ok" : "warn",
    detail: !primary
      ? "-"
      : has(firstPara, primary)
        ? "첫 문단에 키워드 등장"
        : "첫 2~3문장 안에 핵심 키워드를 넣으면 좋아요",
  });

  // 본문 분량
  const bLen = charLen(bodyPlain);
  checks.push({
    label: "본문 분량",
    status: bLen >= 1500 ? "ok" : bLen >= 900 ? "warn" : "bad",
    detail: `${bLen.toLocaleString("ko-KR")}자 (검색용은 1,500자 이상 권장)`,
  });

  // 소제목
  checks.push({
    label: "소제목 개수",
    status: headings.length >= 3 ? "ok" : headings.length >= 1 ? "warn" : "bad",
    detail: `${headings.length}개 ("## " 또는 "■ ", 3~6개 권장)`,
  });

  // 소제목에 키워드
  const headingWithKw = primary
    ? headings.some((h) => has(h, primary))
    : false;
  checks.push({
    label: "소제목에 키워드",
    status: !primary ? "warn" : headingWithKw ? "ok" : "warn",
    detail: !primary
      ? "-"
      : headingWithKw
        ? "소제목 중 하나에 키워드 포함"
        : "소제목 하나쯤엔 관련 키워드가 있으면 좋아요",
  });

  // 문단 길이
  checks.push({
    label: "문단 길이",
    status: longParas === 0 ? "ok" : longParas <= 2 ? "warn" : "bad",
    detail:
      longParas === 0
        ? "적당히 끊겨 있음"
        : `너무 긴 문단 ${longParas}개 — 2~4문장으로 끊어보세요`,
  });

  // 태그
  checks.push({
    label: "태그",
    status: input.tags.length >= 4 ? "ok" : input.tags.length >= 1 ? "warn" : "bad",
    detail: `${input.tags.length}개 (5개 권장)`,
  });

  // 키워드 남용
  if (primary) {
    const count = (bodyPlain.toLowerCase().match(new RegExp(escapeRe(primary), "g")) ?? []).length;
    const density = bLen > 0 ? (count * primary.length) / bLen : 0;
    checks.push({
      label: "키워드 반복",
      status: density > 0.03 ? "bad" : count === 0 ? "warn" : "ok",
      detail:
        density > 0.03
          ? `"${input.keywords[0]}" ${count}회 — 너무 많음(스팸 판정 위험). 연관어로 분산하세요`
          : count === 0
            ? "본문에 핵심 키워드가 안 보임"
            : `본문에 ${count}회 (적정)`,
    });
  }

  const weight = { ok: 1, warn: 0.5, bad: 0 };
  const score = Math.round(
    (checks.reduce((s, c) => s + weight[c.status], 0) / checks.length) * 100
  );

  return { score, checks };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
