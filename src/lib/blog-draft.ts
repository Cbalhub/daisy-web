import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import type { BlogPlatform } from "@prisma/client";

// 블로그 글 초안 생성 — Gemini 에게 SEO 블로그 초안을 부탁하고, 첫 줄 "# 제목" 규칙으로
// 제목/본문을 나눠 돌려줍니다. 자동 포스팅이 아니라 관리자가 검토·수정할 초안입니다.

const DEFAULT_MODEL = "gemini-3.6-flash";

export class BlogDraftError extends Error {}

export type BlogDraftInput = {
  topic: string;
  keywords: string[];
  platform: BlogPlatform;
  tone: string; // "뼈때리기" | "실무 가이드" | "경험담"
};

const PLATFORM_NOTE: Record<BlogPlatform, string> = {
  NAVER:
    "네이버 블로그에 붙여넣을 글입니다. 네이버 에디터는 마크다운을 렌더링하지 않으므로 body 에 별표(**)·백틱(`)·인용(>) 기호를 쓰지 마세요. 소제목은 앞에 \"■ \" 를 붙인 한 줄로 씁니다(예: \"■ 도입 비용은 얼마나 드나요\"). 문단은 2~4문장으로 짧게 끊습니다. 네이버는 검색 미리보기를 본문 첫 문단에서 자동으로 뽑으므로, body 의 첫 문단(2~3문장)이 곧 metaDescription 과 같은 내용이 되도록 씁니다.",
  TISTORY:
    "티스토리에 붙여넣을 글입니다. body 에 \"## 소제목\", \"- 목록\" 마크다운을 사용합니다. 과한 강조는 자제합니다.",
  GENERIC: "자사 블로그 등 범용. body 에 \"## 소제목\", \"- 목록\" 마크다운을 적절히 사용합니다.",
};

const TONE_NOTE: Record<string, string> = {
  뼈때리기:
    "현장에서 여러 번 데인 개발자가 불편한 진실을 말하는 글. 듣기 좋은 소리 말고, 실제로 프로젝트가 어떻게 망가지는지 직설적으로. 예: '3개월 뒤에 어떻게 되는지', '왜 그 방식이 결국 터지는지'. 근거 있는 자신감, 약간 시니컬해도 됨. 겁주기·과장은 금지 — 구체적 메커니즘으로 설득.",
  "실무 가이드":
    "담백하게 사실과 절차 위주로. 감탄사·과장 없이, 표·체크리스트·숫자로 바로 써먹을 수 있게.",
  경험담:
    "구체적인 한 사례를 처음부터 끝까지 따라가는 회고 형식. '처음엔 이렇게 했다 → 이런 문제가 생겼다 → 이렇게 해결/실패했다 → 배운 것'. 미화하지 말고 실패도 그대로.",
};

function buildSystemPrompt(input: BlogDraftInput): string {
  return [
    "당신은 소프트웨어를 여러 번 만들고, 남이 만든 것도 여러 번 이어받아 고쳐 본 한국의 1인 개발자입니다.",
    "그 경험으로 기술 블로그 글을 씁니다. 대상 독자는 '외주를 맡길까 / 직접 만들까 / 노코드로 할까' 고민하는 비개발자 사장님, 또는 갓 시작한 주니어입니다.",
    "",
    "이 글은 광고가 아니라 실무자의 솔직한 글입니다. 절대 규칙:",
    "- 특정 회사·서비스·업체명 언급 금지. '저희', '우리 팀', 상담·문의 유도 금지. (홍보는 발행자가 따로 한 줄 답니다.)",
    "- '전문가에게 맡기세요', '~하시는 것을 추천드립니다' 같은 얼버무리는 결론 금지. 입장을 분명히 밝힙니다.",
    "- 뜬구름·일반론 금지. 구체적인 상황, 실제로 벌어지는 일, 숫자, 시간 순서로 씁니다.",
    "",
    "AI가 쓴 티가 나면 신뢰를 잃습니다. 다음을 특히 피하세요:",
    "- 상투어: '~에 대해 알아보겠습니다', '결론적으로', '오늘은', '~하는 것이 중요합니다', 매 섹션 끝 요약 반복.",
    "- 모든 걸 불릿으로 나열하는 습관. 설명은 문장으로, 목록은 진짜 목록일 때만.",
    "- 균형 잡힌 척 양쪽 다 맞다는 식의 물타기. 한쪽으로 판단을 내립니다.",
    "- 과장된 도입부('요즘 필수', '누구나')와 뻔한 마무리.",
    "",
    "검색 상위 노출을 목표로 JSON 으로 결과를 반환합니다. 각 필드 규칙:",
    "",
    "title: 핵심 키워드를 앞쪽에 넣되, 실무자가 겪는 진짜 문제를 드러냅니다. 예: '노코드 어드민, 6개월 뒤에 왜 지옥이 되나' / '바이브코딩으로 만든 코드, 유지보수가 안 되는 이유'. 32자 내외, 낚시성·물음표 남발 금지. # 기호 없이.",
    "",
    "body: 본문. 규칙:",
    "- 첫 문단(2~3문장): 핵심 키워드 + 이 글이 반박하거나 답하는 통념을 바로 제시. 서론 길게 끌지 않기.",
    "- 가운데: 실제로 무엇이 어떻게 잘못되는지 시간 순서·메커니즘으로. '처음 1주는 잘 된다 → 2개월 차에 이런 게 쌓인다 → 결국 이렇게 터진다' 식.",
    "- 구체적 숫자·기간·비용 범위·흔한 실수·체크리스트로 밀도를 높입니다(지어내지 말고 일반적으로 통용되는 범위로).",
    "- 한 섹션은 사람들이 실제로 검색하는 질문(예: '얼마나 걸리나', '비용', '직접 해도 되나')에 2~4문장으로 직답 — 검색 FAQ 노출용.",
    "- 분량 공백 포함 1800~2800자, 소제목 4~6개. 소제목도 밋밋한 명사구 말고 문제를 드러내는 문장으로.",
    "- 존댓말이되 실무자 말투. 링크·URL 넣지 않습니다.",
    `- 관점: ${TONE_NOTE[input.tone] ?? TONE_NOTE["뼈때리기"]}`,
    `- ${PLATFORM_NOTE[input.platform]}`,
    "",
    "metaDescription: 검색결과에 뜰 한 줄 요약. 공백 포함 70~110자, 핵심 키워드 포함, 글의 핵심 주장 한 줄. (티스토리 '설명' 칸)",
    "",
    "tags: 태그 5개. 검색량 있을 법한 짧은 키워드 위주, # 없이 단어만.",
  ].join("\n");
}

/**
 * 초안을 생성합니다. GEMINI_API_KEY 가 없거나 API 오류면 BlogDraftError 를 던집니다
 * — 호출하는 라우트에서 502 + 사람이 읽는 메시지로 변환합니다.
 */
export async function generateBlogDraft(
  input: BlogDraftInput
): Promise<{ title: string; body: string; metaDescription: string; tags: string[]; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new BlogDraftError("GEMINI_API_KEY 가 설정되지 않았습니다. 서버 .env 를 확인하세요.");
  }

  const model = process.env.BLOG_DRAFT_MODEL || DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = [
    `주제: ${input.topic}`,
    input.keywords.length > 0 ? `핵심 키워드: ${input.keywords.join(", ")}` : "핵심 키워드: (지정 없음 — 주제에서 자연스럽게 도출)",
    "",
    "위 주제로 블로그 글 초안을 써 주세요.",
  ].join("\n");

  // 구조화 출력 — title/body/metaDescription/tags 를 JSON 스키마로 강제해
  // 구분자 파싱 없이 안정적으로 받습니다.
  let raw: string;
  try {
    const res = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: buildSystemPrompt(input),
        maxOutputTokens: 14000,
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["title", "body", "metaDescription", "tags"],
          propertyOrdering: ["title", "body", "metaDescription", "tags"],
        },
      },
    });
    raw = (res.text ?? "").trim();
    if (!raw && res.promptFeedback?.blockReason) {
      throw new BlogDraftError("모델이 이 주제에 대한 작성을 거절했습니다. 주제를 바꿔서 다시 시도해 주세요.");
    }
  } catch (err) {
    if (err instanceof BlogDraftError) throw err;
    const status = (err as { status?: number })?.status;
    if (status === 400 || status === 401 || status === 403) {
      throw new BlogDraftError("GEMINI_API_KEY 가 유효하지 않거나 권한이 없습니다.");
    }
    if (status === 429) {
      throw new BlogDraftError("요청이 너무 많습니다(무료 한도 초과일 수 있음). 잠시 후 다시 시도해 주세요.");
    }
    console.error("[blog-draft] 생성 실패:", err);
    throw new BlogDraftError("초안 생성 중 오류가 발생했습니다.");
  }

  if (!raw) throw new BlogDraftError("빈 응답을 받았습니다. 다시 시도해 주세요.");

  let parsed: { title?: unknown; body?: unknown; metaDescription?: unknown; tags?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[blog-draft] JSON 파싱 실패:", raw.slice(0, 300));
    throw new BlogDraftError("응답 형식이 올바르지 않습니다. 다시 시도해 주세요.");
  }

  const title = String(parsed.title ?? "").replace(/^#+\s*/, "").trim().slice(0, 150);
  const body = String(parsed.body ?? "").trim();
  const metaDescription = String(parsed.metaDescription ?? "").trim().slice(0, 200);
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.map((t) => String(t).trim().replace(/^#/, "")).filter(Boolean).slice(0, 8)
    : [];

  if (!body) throw new BlogDraftError("본문이 비어 있습니다. 다시 시도해 주세요.");

  return { title, body, metaDescription, tags, model };
}
