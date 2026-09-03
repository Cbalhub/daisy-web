import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type AdminRole = "OWNER" | "STAFF";

export type SessionData = {
  adminId?: string;
  email?: string;
  role?: AdminRole;
};

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error(
    "SESSION_SECRET 환경 변수가 없거나 32자 미만입니다. .env.example을 참고해 설정해 주세요."
  );
}

// NODE_ENV === "production"은 "HTTPS로 서빙 중"과 다릅니다 — next start는 로컬/사내망
// 등 순수 HTTP 환경에서도 NODE_ENV를 항상 production으로 고정하므로, 이 값으로
// secure 쿠키를 켜면 HTTPS가 아닌 배포(LAN IP 접속 등)에서 쿠키가 브라우저에
// 저장되지 않아 로그인이 계속 풀리는 문제가 생깁니다. 실제 사이트 주소가
// https://로 시작할 때만 secure를 켭니다.
const isHttpsSite = (process.env.SITE_URL ?? "").startsWith("https://");

export const sessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: "overcook_admin_session",
  cookieOptions: {
    secure: isHttpsSite,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8시간
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
