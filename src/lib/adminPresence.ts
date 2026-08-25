import "server-only";

// 관리자가 "지금 온라인인지"를 아주 가볍게 근사합니다 — 별도 인프라(Redis pub/sub 등)
// 없이, 이 Node 프로세스 메모리에 마지막 활동 시각만 기억해 뒀다가 일정 시간
// 안이면 온라인으로 간주합니다. 서버 재시작하면 초기화되고 다중 인스턴스에서는
// 안 맞을 수 있지만, 지금 규모(단일 인스턴스)에서는 충분합니다.
const ONLINE_WINDOW_MS = 3 * 60 * 1000;
let lastActiveAt = 0;

export function markAdminActive() {
  lastActiveAt = Date.now();
}

export function isAdminOnline() {
  return Date.now() - lastActiveAt < ONLINE_WINDOW_MS;
}
