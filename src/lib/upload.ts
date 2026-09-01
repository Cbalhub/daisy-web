import { randomUUID } from "crypto";
import { unlink } from "fs/promises";
import path from "path";

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
  const root = path.join(process.cwd(), "public", "uploads");
  const abs = path.join(process.cwd(), "public", url.replace(/^\/+/, ""));
  if (abs !== root && !abs.startsWith(root + path.sep)) return;
  await unlink(abs).catch(() => {});
}

// 채팅 첨부는 이미지·PDF·ZIP까지만 허용합니다 — 실행 파일/스크립트류를 열어
// 서버에 저장하는 경로를 만들지 않기 위해 화이트리스트를 의도적으로 좁게 둡니다.
// (docx/pptx 등도 내부적으로 ZIP 포맷이라 이 시그니처로 함께 통과합니다.)
const isZip = (b: Buffer) =>
  b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07);

const CHAT_FILE_TYPES: Record<string, ImageKind> = {
  ...IMAGE_TYPES,
  "application/pdf": { ext: "pdf", check: (b) => b.toString("ascii", 0, 4) === "%PDF" },
  "application/zip": { ext: "zip", check: isZip },
  "application/x-zip-compressed": { ext: "zip", check: isZip },
};

export const MAX_CHAT_FILE_BYTES = 50 * 1024 * 1024;

export function detectChatFileExt(mimeType: string, bytes: Buffer): string | null {
  const kind = CHAT_FILE_TYPES[mimeType];
  if (!kind) return null;
  return kind.check(bytes) ? kind.ext : null;
}

export function isChatImage(mimeType: string) {
  return mimeType in IMAGE_TYPES;
}
