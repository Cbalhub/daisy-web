import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { BLOG_TONES } from "@/lib/validation/blog";
import { BlogDraftError } from "@/lib/blog-draft";

// 매일 자동 발행용 — Gemini 에게 오늘 쓸 글 주제 하나를 고르게 합니다.
// 최근에 쓴 제목들을 같이 넘겨 중복을 피합니다.

const DEFAULT_MODEL = "gemini-3.6-flash";

export type PickedTopic = {
  topic: string;
  keywords: string[];
  tone: (typeof BLOG_TONES)[number];
};

const AREAS = [
  "카카오톡·텔레그램 챗봇",
  "업무 자동화(엑셀·크롤링·알림봇)",
  "관리자 페이지/어드민 도구",
  "외주 개발 vs 직접 개발 vs 노코드",
  "소상공인 웹사이트·예약·결제 연동",
  "바이브코딩/AI 코딩으로 만든 서비스의 유지보수",
  "견적·계약·일정 산정 실무",
];

export async function pickBlogTopic(recentTitles: string[]): Promise<PickedTopic> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new BlogDraftError("GEMINI_API_KEY 가 설정되지 않았습니다.");

  const model = process.env.BLOG_DRAFT_MODEL || DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  const system = [
    "당신은 한국의 1인 소프트웨어 외주 개발자의 블로그 편집자입니다.",
    "이 블로그의 독자는 '외주를 맡길까 / 직접 만들까 / 노코드로 할까' 고민하는 비개발자 사장님, 또는 갓 시작한 주니어입니다.",
    "오늘 쓸 글 주제 하나를 고르세요. 규칙:",
    "- 아래 분야 중 하나에서, 사람들이 실제로 네이버·구글에 검색할 법한 구체적인 질문/고민을 주제로.",
    `  분야: ${AREAS.join(" / ")}`,
    "- 뜬구름 잡는 제목 금지. '비용', '기간', '실패 사례', '체크리스트', '~하면 생기는 문제' 처럼 손에 잡히게.",
    "- 최근에 쓴 제목들과 주제가 겹치면 안 됩니다.",
    "- topic 은 한 문장(30~50자), keywords 는 검색량 있을 법한 짧은 키워드 3~5개.",
    `- tone 은 ${BLOG_TONES.join(" / ")} 중 하나. 대부분 '뼈때리기', 사례 중심이면 '경험담', 절차 설명이면 '실무 가이드'.`,
  ].join("\n");

  const user =
    recentTitles.length > 0
      ? `최근에 쓴 제목들 (겹치지 말 것):\n${recentTitles.map((t) => `- ${t}`).join("\n")}`
      : "아직 쓴 글이 없습니다. 첫 주제를 고르세요.";

  let raw: string;
  try {
    const res = await ai.models.generateContent({
      model,
      contents: user,
      config: {
        systemInstruction: system,
        maxOutputTokens: 2000,
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            tone: { type: Type.STRING, enum: [...BLOG_TONES] },
          },
          required: ["topic", "keywords", "tone"],
          propertyOrdering: ["topic", "keywords", "tone"],
        },
      },
    });
    raw = (res.text ?? "").trim();
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 429) throw new BlogDraftError("요청이 너무 많습니다(무료 한도 초과).");
    console.error("[blog-topic] 실패:", err);
    throw new BlogDraftError("주제 선정 중 오류가 발생했습니다.");
  }

  let parsed: { topic?: unknown; keywords?: unknown; tone?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BlogDraftError("주제 응답 형식이 올바르지 않습니다.");
  }

  const topic = String(parsed.topic ?? "").trim().slice(0, 200);
  if (topic.length < 5) throw new BlogDraftError("주제를 뽑지 못했습니다.");
  const keywords = Array.isArray(parsed.keywords)
    ? parsed.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 8)
    : [];
  const tone = (BLOG_TONES as readonly string[]).includes(String(parsed.tone))
    ? (parsed.tone as PickedTopic["tone"])
    : "뼈때리기";

  return { topic, keywords, tone };
}
