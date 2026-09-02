// 포트폴리오 항목마다 저장하는 "플랫폼 목업" 설정.
// 관리자가 텍스트로 대화/로그를 입력하면 ProjectMockup 이 플랫폼 껍데기 안에 렌더합니다.

export type MockupPlatform = "telegram" | "discord" | "program";

export type MockupChatLine = { from: "user" | "bot"; text: string };

export type MockupScene = {
  chat?: MockupChatLine[]; // telegram / discord
  buttons?: string[]; // telegram 인라인 키보드 (buttons 만 있으면 메뉴 화면)
  logs?: string[]; // program 로그 라인
  caption?: string; // 화면 아래 짧은 설명 (선택)
};

export type MockupConfig = {
  platform: MockupPlatform;
  name: string; // 봇 이름 / 채널명 / 프로그램 제목
  scenes: MockupScene[]; // 1~4
};

export const MOCKUP_PLATFORM_LABEL: Record<MockupPlatform, string> = {
  telegram: "텔레그램",
  discord: "디스코드",
  program: "프로그램",
};

// 관리자가 textarea 에 "유저: ...", "봇: ..." 로 쓴 걸 구조화합니다.
// 접두어 없는 줄은 봇 메시지로 봅니다.
export function parseChatText(raw: string): MockupChatLine[] {
  const rows: MockupChatLine[] = [];
  for (const ln of raw.split("\n")) {
    const s = ln.trim();
    if (!s) continue;
    const um = s.match(/^(유저|고객|나|user|u)\s*[:：]\s*(.*)$/i);
    if (um) {
      rows.push({ from: "user", text: um[2].trim() });
      continue;
    }
    const bm = s.match(/^(봇|답|응답|bot|b)\s*[:：]\s*(.*)$/i);
    rows.push({ from: "bot", text: (bm ? bm[2] : s).trim() });
  }
  return rows;
}

// 구조화된 chat 을 다시 편집용 텍스트로.
export function chatToText(chat: MockupChatLine[] | undefined): string {
  if (!chat?.length) return "";
  return chat.map((m) => `${m.from === "user" ? "유저" : "봇"}: ${m.text}`).join("\n");
}

// 알 수 없는 값이 DB 에 있어도 안전하게 MockupConfig 로 좁힙니다. 아니면 null.
export function normalizeMockup(value: unknown): MockupConfig | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (v.platform !== "telegram" && v.platform !== "discord" && v.platform !== "program") return null;
  if (typeof v.name !== "string" || !v.name.trim()) return null;
  if (!Array.isArray(v.scenes) || v.scenes.length === 0) return null;

  const scenes: MockupScene[] = [];
  for (const raw of v.scenes.slice(0, 4)) {
    if (!raw || typeof raw !== "object") continue;
    const s = raw as Record<string, unknown>;
    const scene: MockupScene = {};
    if (Array.isArray(s.chat)) {
      scene.chat = s.chat
        .filter((c): c is MockupChatLine => !!c && typeof c === "object" && "text" in c)
        .map((c) => ({ from: c.from === "user" ? "user" : "bot", text: String((c as MockupChatLine).text) }));
    }
    if (Array.isArray(s.buttons)) scene.buttons = s.buttons.map(String).filter(Boolean).slice(0, 8);
    if (Array.isArray(s.logs)) scene.logs = s.logs.map(String).filter(Boolean).slice(0, 16);
    if (typeof s.caption === "string" && s.caption.trim()) scene.caption = s.caption.trim();
    if (scene.chat?.length || scene.buttons?.length || scene.logs?.length) scenes.push(scene);
  }
  if (scenes.length === 0) return null;

  return { platform: v.platform, name: v.name.trim(), scenes };
}
