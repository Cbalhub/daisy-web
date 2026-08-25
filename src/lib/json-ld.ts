/**
 * JSON.stringify는 "<"를 이스케이프하지 않습니다. 관리자가 입력한 값(제목,
 * 상호명 등)에 "</script>"가 포함되면 <script type="application/ld+json">
 * 태그가 조기 종료되고 그 뒤에 임의 스크립트가 주입될 수 있습니다(XSS).
 * "<"만 유니코드 이스케이프해서 이 클래스의 문제를 원천 차단합니다.
 */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
