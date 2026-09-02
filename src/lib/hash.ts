// bcrypt 작업 계수(cost). bcryptjs(순수 JS)를 2코어 VPS 에서 돌리면 cost 12 는
// compare 한 번에 ~650ms 라 로그인이 눈에 띄게 느립니다. 10 은 ~250ms 이고 OWASP
// 최소 권장선이라 보안상 충분합니다. 기존에 cost 12 로 저장된 해시도 그대로 검증됩니다
// (cost 가 해시 문자열에 박혀 있음).
export const BCRYPT_COST = 10;
