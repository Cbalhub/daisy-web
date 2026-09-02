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
  tone: string; // "담백" | "친근" | "전문"
};

const PLATFORM_NOTE: Record<BlogPlatform, string> = {
  NAVER:
    "네이버 블로그에 붙여넣을 글입니다. 네이버 에디터는 마크다운을 렌더링하지 않으므로 body 에 별표(**)·백틱(`)·인용(>) 기호를 쓰지 마세요. 소제목은 앞에 \"■ \" 를 붙인 한 줄로 씁니다(예: \"■ 도입 비용은 얼마나 드나요\"). 문단은 2~4문장으로 짧게 끊습니다. 네이버는 검색 미리보기를 본문 첫 문단에서 자동으로 뽑으므로, body 의 첫 문단(2~3문장)이 곧 metaDescription 과 같은 내용이 되도록 씁니다.",
  TISTORY:
    "티스토리에 붙여넣을 글입니다. body 에 \"## 소제목\", \"- 목록\" 마크다운을 사용합니다. 과한 강조는 자제합니다.",
  GENERIC: "자사 블로그 등 범용. body 에 \"## 소제목\", \"- 목록\" 마크다운을 적절히 사용합니다.",
};

const TONE_NOTE: Record<string, string> = {
  담백: "담백하고 사실 위주로. 과장·감탄사 없이.",
  친근: "친근한 반말 아닌 존댓말로, 읽는 사람에게 말 걸듯이.",
  전문: "전문적이고 신뢰감 있게. 용어는 쓰되 처음 나올 때 풀어서.",
};

function buildSystemPrompt(input: BlogDraftInput): string {
  return [
    "당신은 소프트웨어 개발 외주 회사 MOVD의 블로그 글을 쓰는 한국어 SEO 카피라이터입니다.",
    "MOVD는 카카오톡·텔레그램 챗봇, 업무 자동화 프로그램, 관리자 대시보드를 만드는 1인 중심 개발 외주입니다. 예산을 먼저 듣고 그 안에서 설계하며, 상담부터 배포·유지보수까지 대표가 직접 합니다.",
    "",
    "검색 상위 노출을 목표로 JSON 으로 결과를 반환합니다. 각 필드 규칙:",
    "",
    "title: 핵심 키워드를 앞쪽에 자연스럽게 넣은 제목. 32자 내외, 숫자·구체어로 클릭을 유도하되 낚시성은 피합니다. # 등 기호 없이 제목 텍스트만.",
    "",
    "body: 본문. 규칙:",
    "- 첫 문단(2~3문장) 안에 핵심 키워드와 이 글이 답하는 질문을 명확히 씁니다.",
    "- 검색으로 들어온 사람에게 실제로 도움이 되는 정보. 키워드를 부자연스럽게 반복하지 않고 연관어·동의어를 섞습니다.",
    "- 분량은 공백 포함 1800~2800자, 소제목 4~6개.",
    "- 한 섹션은 자주 묻는 질문 형태(질문 한 줄 + 바로 아래 2~4문장 답)로 구성합니다 — 검색 FAQ 노출에 유리합니다.",
    "- 구체적 숫자·기간·비용 범위·체크리스트로 정보 밀도를 높입니다(지어내지 말고 일반적으로 통용되는 범위로).",
    "- 자연스러운 한국어 존댓말. AI 티 나는 상투어(\"~에 대해 알아보겠습니다\", \"결론적으로\", 불필요한 요약 반복) 금지.",
    "- 마지막 섹션은 MOVD가 이 주제로 어떻게 도와줄 수 있는지 1문단으로 자연스럽게 안내(과한 홍보 금지).",
    `- 톤: ${TONE_NOTE[input.tone] ?? TONE_NOTE["담백"]}`,
    `- ${PLATFORM_NOTE[input.platform]}`,
    "",
    "metaDescription: 검색결과에 뜰 한 줄 요약. 공백 포함 70~110자, 핵심 키워드 포함. (티스토리 '설명' 칸에 들어감)",
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
