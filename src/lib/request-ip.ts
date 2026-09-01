// 신뢰할 수 있는 클라이언트 IP 를 뽑습니다.
//
// X-Forwarded-For 의 맨 앞 값은 클라이언트가 임의로 넣을 수 있어(위조 가능) 그대로
// 쓰면 안 됩니다. 이 사이트는 nginx 리버스 프록시 한 단 뒤에서 돕니다:
//   - nginx 가 X-Real-IP 에 실제 접속 IP 를 넣어줍니다  → 이걸 1순위로.
//   - nginx 는 XFF 끝에 접속 IP 를 append 합니다        → 대안으로 "맨 뒤" 값.
// 계약서 전자서명의 증거로 저장되는 값이라 특히 위조 가능한 값을 그대로 신뢰하면 안 됩니다.
//
// 프록시를 여러 단 두거나 구성이 바뀌면 이 로직도 함께 조정해야 합니다.
export function clientIp(req: Request): string | null {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    // nginx 가 붙인 마지막 값(= 실제 접속 IP). 앞쪽은 클라이언트가 위조했을 수 있음.
    return parts[parts.length - 1] ?? null;
  }
  return null;
}
