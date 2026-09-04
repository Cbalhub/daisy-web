// 블로그 초안 본문(마크다운-ish) → 플랫폼별 붙여넣기/발행용 텍스트.
// 편집기의 "복사" 버튼과 발행 대기열 API(/api/publish/queue) 양쪽에서 씁니다.

// 네이버 블로그용 — 네이버 에디터는 마크다운을 렌더링하지 않으므로 기호를 제거하고
// 소제목·목록을 사람이 읽는 형태로 바꿉니다.
export function toPlainText(body: string): string {
  return body
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*■\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "· ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .trim();
}

// 티스토리용 — 마크다운 그대로.
export function toMarkdown(body: string): string {
  return body.trim();
}
