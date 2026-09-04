import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { normalizeGroups, totalDays, type EstimateGroup } from "@/lib/estimate-format";

export { normalizeGroups, totalDays };
export type { EstimateGroup, EstimateItem } from "@/lib/estimate-format";

// 고객이 길게 적어 보낸 문의를 붙여넣으면 Gemini 가 기능 그룹·항목으로 쪼개고
// 항목별 예상 작업일수(1인 개발 기준)를 추정합니다. 금액은 넣지 않습니다 — 대표가 직접.

const DEFAULT_MODEL = "gemini-3.6-flash";

export class EstimateError extends Error {}

export type EstimateResult = {
  projectName: string;
  summary: string;
  groups: EstimateGroup[];
  notes: string;
  model: string;
};

function buildSystemPrompt(): string {
  return [
    "당신은 한국의 1인 소프트웨어 외주 개발자입니다. 고객이 채팅·메일로 길게 적어 보낸 요구사항을",
    "읽고, 견적을 내기 위한 '작업 분해(WBS)' 초안을 만듭니다.",
    "",
    "규칙:",
    "- 고객 원문에 실제로 있는 요구만 항목으로 만듭니다. 없는 기능을 상상해서 넣지 않습니다.",
    "- 기능을 성격이 비슷한 것끼리 묶어 group 으로 나눕니다(예: 보안/관리, 게임, 결제, 이벤트, 음악, 공통 인프라).",
    "- 각 group 의 items 는 개발자가 실제로 잡는 작업 단위로 쪼갭니다. 항목 이름은 짧게, detail 에 무엇을 만드는지 1~2문장.",
    "- days: 그 항목 하나를 1인 개발자가 설계·구현·자체테스트까지 끝내는 데 걸리는 실제 작업일수(정수 또는 0.5 단위). 낙관값 말고 현실값.",
    "- 요구가 모호하면 합리적으로 가정하고, 그 가정을 notes 에 적습니다. 절대 days 를 부풀리거나 0 으로 얼버무리지 않습니다.",
    "- 배포·환경설정·문서·QA·예비(버퍼)를 '공통' group 에 별도 항목으로 꼭 넣습니다.",
    "- 금액·단가·원 단위는 절대 쓰지 않습니다. 오직 작업일수만.",
    "",
    "notes 에는 (1) 견적에 포함한 가정, (2) 이 견적에서 제외한 범위, (3) 별도 비용이 드는 외부 서비스(예: 서버·API 유료 플랜) 를 간단히 적습니다.",
    "summary 는 프로젝트를 한 문장으로. projectName 은 15자 내외의 짧은 제목.",
  ].join("\n");
}

export async function generateEstimate(sourceText: string): Promise<EstimateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new EstimateError("GEMINI_API_KEY 가 설정되지 않았습니다. 서버 .env 를 확인하세요.");
  }

  const model = process.env.BLOG_DRAFT_MODEL || DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  let raw: string;
  try {
    const res = await ai.models.generateContent({
      model,
      contents: `다음은 고객이 보낸 요구사항 원문입니다. 작업 분해 견적 초안을 JSON 으로 만들어 주세요.\n\n---\n${sourceText}\n---`,
      config: {
        systemInstruction: buildSystemPrompt(),
        maxOutputTokens: 14000,
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING },
            summary: { type: Type.STRING },
            notes: { type: Type.STRING },
            groups: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  note: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        detail: { type: Type.STRING },
                        days: { type: Type.NUMBER },
                      },
                      required: ["name", "detail", "days"],
                      propertyOrdering: ["name", "detail", "days"],
                    },
                  },
                },
                required: ["name", "note", "items"],
                propertyOrdering: ["name", "note", "items"],
              },
            },
          },
          required: ["projectName", "summary", "notes", "groups"],
          propertyOrdering: ["projectName", "summary", "notes", "groups"],
        },
      },
    });
    raw = (res.text ?? "").trim();
    if (!raw && res.promptFeedback?.blockReason) {
      throw new EstimateError("모델이 이 요청 처리를 거절했습니다. 내용을 다듬어 다시 시도해 주세요.");
    }
  } catch (err) {
    if (err instanceof EstimateError) throw err;
    const status = (err as { status?: number })?.status;
    if (status === 400 || status === 401 || status === 403) {
      throw new EstimateError("GEMINI_API_KEY 가 유효하지 않거나 권한이 없습니다.");
    }
    if (status === 429) {
      throw new EstimateError("요청이 너무 많습니다(무료 한도 초과일 수 있음). 잠시 후 다시 시도해 주세요.");
    }
    console.error("[estimate] 생성 실패:", err);
    throw new EstimateError("견적 초안 생성 중 오류가 발생했습니다.");
  }

  if (!raw) throw new EstimateError("빈 응답을 받았습니다. 다시 시도해 주세요.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[estimate] JSON 파싱 실패:", raw.slice(0, 300));
    throw new EstimateError("응답 형식이 올바르지 않습니다. 다시 시도해 주세요.");
  }

  const p = parsed as Record<string, unknown>;
  const groups: EstimateGroup[] = normalizeGroups(p.groups);
  if (groups.length === 0) throw new EstimateError("작업 항목을 뽑지 못했습니다. 요구사항을 더 구체적으로 붙여넣어 주세요.");

  return {
    projectName: String(p.projectName ?? "").trim().slice(0, 80),
    summary: String(p.summary ?? "").trim().slice(0, 500),
    notes: String(p.notes ?? "").trim().slice(0, 4000),
    groups,
    model,
  };
}
