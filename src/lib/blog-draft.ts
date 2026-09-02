import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { BlogPlatform } from "@prisma/client";

// 블로그 글 초안 생성 — Claude 에게 SEO 블로그 초안을 부탁하고, 첫 줄 "# 제목" 규칙으로
// 제목/본문을 나눠 돌려줍니다. 자동 포스팅이 아니라 관리자가 검토·수정할 초안입니다.

const DEFAULT_MODEL = "claude-opus-5";

export class BlogDraftError extends Error {}

export type BlogDraftInput = {
  topic: string;
  keywords: string[];
  platform: BlogPlatform;
  tone: string; // "담백" | "친근" | "전문"
};

const PLATFORM_NOTE: Record<BlogPlatform, string> = {
  NAVER:
    "네이버 블로그에 붙여넣을 글입니다. 문단을 짧게(2~4문장) 끊고, 마크다운 기호(**, `, > 등)는 쓰지 마세요. 소제목만 \"## \"로 표시합니다.",
  TISTORY:
    "티스토리에 붙여넣을 글입니다. \"## 소제목\"과 \"- 목록\" 마크다운은 사용해도 됩니다. 과한 강조는 자제합니다.",
  GENERIC: "자사 블로그 등 범용. \"## 소제목\"과 \"- 목록\"을 적절히 사용합니다.",
};

const TONE_NOTE: Record<string, string> = {
  담백: "담백하고 사실 위주로. 과장·감탄사 없이.",
  친근: "친근한 반말 아닌 존댓말로, 읽는 사람에게 말 걸듯이.",
  전문: "전문적이고 신뢰감 있게. 용어는 쓰되 처음 나올 때 풀어서.",
};

function buildSystemPrompt(input: BlogDraftInput): string {
  return [
    "당신은 소프트웨어 개발 외주 회사 'MOVD'의 블로그 글을 쓰는 한국어 SEO 카피라이터입니다.",
    "MOVD는 카카오톡·텔레그램 챗봇, 업무 자동화 프로그램, 관리자 대시보드를 만드는 1인 중심 개발 외주입니다. 예산을 먼저 듣고 그 안에서 설계하며, 상담부터 배포·유지보수까지 대표가 직접 합니다.",
    "",
    "검색 상위 노출을 목표로 합니다. 규칙:",
    "- 제목(H1)에 핵심 키워드를 앞쪽에 자연스럽게 넣습니다. 32자 내외, 숫자·구체어로 클릭을 유도하되 낚시성은 피합니다.",
    "- 첫 문단(80~120자) 안에 핵심 키워드와 이 글이 답하는 질문을 명확히 씁니다.",
    "- 검색으로 들어온 사람에게 실제로 도움이 되는 정보를 씁니다. 키워드를 부자연스럽게 반복하지 않고, 연관어·동의어를 섞습니다.",
    "- 분량은 공백 포함 1800~2800자.",
    "- \"## 소제목\"으로 4~6개 섹션. 소제목에도 관련 키워드를 자연스럽게 넣습니다.",
    "- 가능하면 한 섹션은 \"자주 묻는 질문\" 형태(질문을 ### 또는 굵은 문장으로, 바로 아래 2~4문장 답)로 구성합니다 — 검색 FAQ 노출에 유리합니다.",
    "- 구체적 숫자·기간·비용 범위·체크리스트를 넣어 정보 밀도를 높입니다(지어내지 말고 일반적으로 통용되는 범위로).",
    "- 자연스러운 한국어 존댓말. AI가 쓴 티가 나는 상투적 표현(\"~에 대해 알아보겠습니다\", \"결론적으로\", 불필요한 요약 반복)을 피합니다.",
    "- 마지막 섹션은 MOVD가 이 주제로 어떻게 도와줄 수 있는지 1문단으로 자연스럽게 안내합니다(과한 홍보 금지).",
    `- 톤: ${TONE_NOTE[input.tone] ?? TONE_NOTE["담백"]}`,
    `- ${PLATFORM_NOTE[input.platform]}`,
    "",
    "출력 형식(반드시 이 순서·형식을 지킬 것):",
    "1) 첫 줄: \"# \" 로 시작하는 제목 한 줄.",
    "2) 빈 줄 뒤 본문. 본문에는 \"# \"(H1)를 다시 쓰지 않습니다.",
    "3) 본문이 끝나면 한 줄에 \"---META---\" 를 적고, 그 아래에:",
    "   설명: (검색결과에 뜰 한 줄 요약, 공백 포함 70~110자, 핵심 키워드 포함)",
    "   태그: (쉼표로 구분한 태그 5개 — 검색량 있을 법한 짧은 키워드 위주)",
    "4) \"---META---\" 앞뒤로 다른 설명·코멘트를 붙이지 않습니다.",
  ].join("\n");
}

/**
 * 초안을 생성합니다. ANTHROPIC_API_KEY 가 없거나 API 오류면 BlogDraftError 를 던집니다
 * — 호출하는 라우트에서 502 + 사람이 읽는 메시지로 변환합니다.
 */
export async function generateBlogDraft(
  input: BlogDraftInput
): Promise<{ title: string; body: string; metaDescription: string; tags: string[]; model: string }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new BlogDraftError("ANTHROPIC_API_KEY 가 설정되지 않았습니다. 서버 .env 를 확인하세요.");
  }

  const model = process.env.BLOG_DRAFT_MODEL || DEFAULT_MODEL;
  const client = new Anthropic();

  const userPrompt = [
    `주제: ${input.topic}`,
    input.keywords.length > 0 ? `핵심 키워드: ${input.keywords.join(", ")}` : "핵심 키워드: (지정 없음 — 주제에서 자연스럽게 도출)",
    "",
    "위 주제로 블로그 글 초안을 써 주세요.",
  ].join("\n");

  let text: string;
  try {
    const res = await client.messages.create({
      model,
      max_tokens: 10000,
      system: buildSystemPrompt(input),
      messages: [{ role: "user", content: userPrompt }],
    });
    if (res.stop_reason === "refusal") {
      throw new BlogDraftError("모델이 이 주제에 대한 작성을 거절했습니다. 주제를 바꿔서 다시 시도해 주세요.");
    }
    text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  } catch (err) {
    if (err instanceof BlogDraftError) throw err;
    if (err instanceof Anthropic.AuthenticationError) {
      throw new BlogDraftError("ANTHROPIC_API_KEY 가 유효하지 않습니다.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new BlogDraftError("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
    }
    console.error("[blog-draft] 생성 실패:", err);
    throw new BlogDraftError("초안 생성 중 오류가 발생했습니다.");
  }

  if (!text) throw new BlogDraftError("빈 응답을 받았습니다. 다시 시도해 주세요.");

  // "---META---" 뒤의 설명·태그를 분리합니다.
  let metaDescription = "";
  let tags: string[] = [];
  const metaSplit = text.split(/\n-{2,}\s*META\s*-{2,}\s*\n/i);
  let mainText = text;
  if (metaSplit.length > 1) {
    mainText = metaSplit[0].trim();
    const metaBlock = metaSplit.slice(1).join("\n");
    const descMatch = metaBlock.match(/설명\s*[:：]\s*(.+)/);
    if (descMatch) metaDescription = descMatch[1].trim().slice(0, 200);
    const tagMatch = metaBlock.match(/태그\s*[:：]\s*(.+)/);
    if (tagMatch) {
      tags = tagMatch[1]
        .split(/[,、·#]/)
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean)
        .slice(0, 8);
    }
  }

  // 첫 "# 제목" 줄을 뽑고 나머지를 본문으로. 규칙을 안 지켰으면 첫 줄을 제목으로.
  const lines = mainText.split("\n");
  let title = "";
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    title = line.replace(/^#+\s*/, "").trim();
    bodyStart = i + 1;
    break;
  }
  const body = lines.slice(bodyStart).join("\n").trim();

  return { title: title.slice(0, 150), body, metaDescription, tags, model };
}
