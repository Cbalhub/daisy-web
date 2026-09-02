import { hash, verify } from "@node-rs/bcrypt";

// 비밀번호 해싱 — @node-rs/bcrypt (Rust, 플랫폼별 사전 빌드 바이너리라 빌드도구 불필요).
// 예전엔 bcryptjs(순수 JS)라 2코어 VPS 에서 compare 한 번에 ~650ms(cost 12) 걸려
// 로그인이 느렸습니다. 지금은 cost 10 기준 compare ~15ms.
//
// cost 10 은 OWASP 최소 권장선이라 보안상 충분하고, bcrypt 해시는 알고리즘이 같아
// 예전 $2a/$2b, cost 12 로 저장된 해시도 그대로 검증됩니다.
export const BCRYPT_COST = 10;

// 존재하지 않는 계정에도 실제 계정과 같은 시간이 걸리게 하는 더미 해시(타이밍 공격
// 방지). 실제 $2b$10$ 해시라서 verify 가 예외 없이 false 를 돌려줍니다.
export const DUMMY_HASH =
  "$2b$10$ImmHMHS/QNW8MLnFFQalUOOk48.tccQt7KV1RCnSF/nN1sKsgWaj6";

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_COST);
}

export function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return verify(plain, hashed);
}
