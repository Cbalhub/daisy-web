import { randomUUID } from "crypto";
import { unlink } from "fs/promises";
import path from "path";

// 업로드 파일의 물리적 저장 위치. 배포마다 릴리스 디렉터리가 새로 생기므로
// 프로덕션에서는 릴리스 밖 영속 경로를 UPLOADS_DIR 로 지정하고, nginx 가
// /uploads/ 를 그 경로에서 직접 서빙합니다(deploy/README 참고).
// 미설정(로컬 개발)이면 public/uploads — Next 가 정적으로 서빙합니다.
export function uploadsDir(...sub: string[]): string {
  const base = process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads");
  return path.join(base, ...sub);
}

type ImageKind = { ext: string; check: (bytes: Buffer) => boolean };

// 확장자는 클라이언트가 보낸 파일명이나 Content-Type 헤더가 아니라, 실제 파일 내용의
// 매직 넘버로 검증한 뒤에만 결정합니다 — 위조된 MIME 타입이나 이중 확장자로 서버가
// 실행 가능한 파일을 이미지로 오인해 저장하는 경로를 막기 위함입니다.
const IMAGE_TYPES: Record<string, ImageKind> = {
  "image/jpeg": { ext: "jpg", check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": {
    ext: "png",
    check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  "image/webp": {
    ext: "webp",
    check: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  },
  "image/gif": { ext: "gif", check: (b) => b.toString("ascii", 0, 4) === "GIF8" },
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGES_PER_REQUEST = 8;

export function detectImageExt(mimeType: string, bytes: Buffer): string | null {
  const kind = IMAGE_TYPES[mimeType];
  if (!kind) return null;
  return kind.check(bytes) ? kind.ext : null;
}

export function randomImageFilename(ext: string) {
  return `${randomUUID()}.${ext}`;
}

// req.formData() 는 요청 본문 전체를 메모리에 올린 뒤에야 파싱합니다 — file.size 를
// 그 다음에 확인해봐야 이미 거대한 파일이 RAM 에 다 올라온 뒤라, 동시에 몇 개만
// 들어와도 작은 VPS 는 OOM 으로 죽습니다. 그래서 formData() 를 부르기 전에
// Content-Length 헤더부터 봅니다(브라우저·curl·undici 모두 이 헤더를 붙입니다).
// 헤더 위조/누락은 nginx client_max_body_size 가 최종 방어선입니다.
const MULTIPART_OVERHEAD = 8 * 1024;

export function declaredBodyTooLarge(req: Request, maxTotalBytes: number): boolean {
  const len = Number(req.headers.get("content-length"));
  return Number.isFinite(len) && len > maxTotalBytes + MULTIPART_OVERHEAD;
}

// "/uploads/…" URL 로 저장돼 있던 파일을 디스크에서 지웁니다(포트폴리오·이벤트·채팅
// 첨부가 삭제될 때). 경로 이탈을 막으려고 public/uploads 하위만 허용하고, 이미 없는
// 파일은 조용히 무시합니다.
export async function deleteUploadByUrl(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith("/uploads/")) return;
  const root = uploadsDir();
  const abs = path.join(root, url.replace(/^\/uploads\/+/, ""));
  if (abs !== root && !abs.startsWith(root + path.sep)) return;
  await unlink(abs).catch(() => {});
}

export const MAX_CHAT_FILE_BYTES = 50 * 1024 * 1024;

// /api/chat/upload 가 돌려준 경로만 첨부로 받도록 검증하는 정규식(단일 소스).
// UUID 파일명 + 선택적 확장자(영문숫자 1~12자). 임의 경로 주입 차단용.
export const CHAT_UPLOAD_URL_RE = /^\/uploads\/chat\/[a-zA-Z0-9_-]+(\.[a-z0-9]{1,12})?$/;

// 채팅 첨부는 파일 형식을 제한하지 않습니다 — 고객이 어떤 자료든 보낼 수 있어야 하고,
// 저장된 파일은 nginx 가 Content-Disposition: attachment + octet-stream 으로만 서빙해
// 브라우저에서 실행/렌더되지 않습니다(HTML·SVG 도 다운로드만). 서버에서 이 파일을
// 실행하는 경로는 어디에도 없습니다.
// 원본 파일명에서 안전한 확장자만 뽑아 저장 파일명에 붙입니다(표시·다운로드 편의용).
export function safeExtFromName(name: string): string | null {
  const m = /\.([a-zA-Z0-9]{1,12})$/.exec(name.trim());
  return m ? m[1].toLowerCase() : null;
}

export function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}
