import "server-only";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM 표준 nonce 길이
const AUTH_TAG_LENGTH = 16;

const encryptionSecret = process.env.FIELD_ENCRYPTION_KEY;
if (!encryptionSecret || encryptionSecret.length < 32) {
  throw new Error(
    "FIELD_ENCRYPTION_KEY 환경 변수가 없거나 32자 미만입니다. .env.example을 참고해 설정해 주세요."
  );
}

// 환경 변수는 아무 길이의 무작위 문자열이면 되고(SESSION_SECRET과 동일한 관례),
// 여기서 SHA-256으로 해시해 AES-256에 필요한 정확히 32바이트 키로 만듭니다.
const key = crypto.createHash("sha256").update(encryptionSecret).digest();

/**
 * DB 컬럼에 저장하기 전 평문 문자열을 AES-256-GCM으로 암호화합니다.
 * 매번 새로운 무작위 IV를 사용하므로(GCM의 안전성 요구사항), 같은 평문이라도
 * 매번 다른 암호문이 나옵니다 — 그래서 이 값으로는 등호(=) 검색이 불가능합니다.
 * 이메일처럼 로그인 조회에 쓰이는 필드에는 사용하지 않습니다.
 */
export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * encryptField로 암호화된 값을 원래 평문으로 복호화합니다. 인증 태그가 안 맞으면
 * (변조되었거나 키가 다르면) 예외를 던집니다 — 이 경우 호출하는 쪽에서 처리해야 합니다.
 */
export function decryptField(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

// 이 접두사로 "암호화된 값인지"를 빠르게 판별합니다 — 마이그레이션 이전에 저장된
// 평문 데이터가 남아있어도 복호화를 시도하다 예외로 죽지 않고 그대로 반환하기 위함입니다.
const ENC_PREFIX = "enc:";

export function encryptFieldTagged(plaintext: string): string {
  return ENC_PREFIX + encryptField(plaintext);
}

export function decryptFieldTagged(value: string): string {
  if (!value.startsWith(ENC_PREFIX)) return value; // 암호화 이전의 평문 데이터
  try {
    return decryptField(value.slice(ENC_PREFIX.length));
  } catch {
    return value; // 복호화 실패 시 원본을 그대로 반환(화면이 완전히 깨지는 것보다 안전)
  }
}
