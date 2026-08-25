import type { NextRequest } from "next/server";

// Route Handler는 Server Action과 달리 Next.js의 origin 검증을 자동으로 받지 않으므로,
// 세션 쿠키로 인증되는 mutating 요청에는 이 검사를 명시적으로 붙입니다.
//
// req.nextUrl.host가 아니라 원본 Host 헤더와 비교합니다 — next start를 -H 0.0.0.0
// 없이 띄우면 req.nextUrl.host가 실제 접속 주소와 무관하게 항상 "localhost:포트"로
// 고정되는 Next.js의 알려진 동작 때문에, localhost가 아닌 주소(LAN IP 등)로 접속하면
// 정상 요청까지 전부 막히는 버그가 있었습니다. Host 헤더는 리버스 프록시 없이 직접
// 서빙하는 이 배포 구조에서는 실제 접속 주소를 그대로 반영합니다.
export function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
