import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type CustomerSessionData = {
  customerId?: string;
  email?: string;
};

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error(
    "SESSION_SECRET 환경 변수가 없거나 32자 미만입니다. .env.example을 참고해 설정해 주세요."
  );
}

// 관리자 세션과는 다른 쿠키 이름을 사용해 완전히 분리된 세션으로 관리합니다.
// (같은 SESSION_SECRET을 재사용하지만, 쿠키 이름이 다르므로 서로의 세션으로 위장할 수 없습니다.)
//
// secure는 NODE_ENV가 아니라 실제 사이트 주소(https 여부)로 판단합니다 — next start는
// 순수 HTTP 환경(로컬/LAN IP 등)에서도 NODE_ENV를 항상 production으로 고정하므로,
// NODE_ENV 기준으로 켜면 HTTPS가 아닌 배포에서 쿠키가 저장되지 않아 로그인이 계속
// 풀리는 문제가 생깁니다.
const isHttpsSite = (process.env.SITE_URL ?? "").startsWith("https://");

export const customerSessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: "overcook_customer_session",
  cookieOptions: {
    secure: isHttpsSite,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30일
  },
};

export async function getCustomerSession() {
  return getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions);
}
