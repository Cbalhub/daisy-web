import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import { customerSessionOptions, type CustomerSessionData } from "@/lib/customer-session";

async function readSealedId<T extends { customerId?: string } | { adminId?: string }>(
  cookieValue: string | undefined,
  password: string
): Promise<string | undefined> {
  if (!cookieValue) return undefined;
  try {
    const data = await unsealData<T>(cookieValue, { password });
    return (data as { adminId?: string; customerId?: string }).adminId ??
      (data as { adminId?: string; customerId?: string }).customerId;
  } catch {
    return undefined;
  }
}

async function readAdminSession(
  req: NextRequest
): Promise<{ adminId: string; role: string } | null> {
  const cookieValue = req.cookies.get(sessionOptions.cookieName)?.value;
  if (!cookieValue) return null;
  try {
    const data = await unsealData<SessionData>(cookieValue, {
      password: sessionOptions.password as string,
    });
    if (!data.adminId) return null;
    return { adminId: data.adminId, role: data.role ?? "OWNER" };
  } catch {
    return null;
  }
}

// STAFF 역할이 접근할 수 있는 경로 — 채팅과 대시보드만.
function staffAllowed(pathname: string): boolean {
  if (pathname === "/admin" || pathname === "/admin/") return true;
  if (pathname === "/admin/chats" || pathname.startsWith("/admin/chats/")) return true;
  if (pathname.startsWith("/api/admin/chats/")) return true;
  if (pathname === "/api/admin/logout" || pathname === "/api/admin/password") return true;
  return false;
}

async function getCustomerId(req: NextRequest) {
  return readSealedId<CustomerSessionData>(
    req.cookies.get(customerSessionOptions.cookieName)?.value,
    customerSessionOptions.password as string
  );
}

function redirectToCustomerLogin(req: NextRequest) {
  const loginUrl = new URL("/account/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/* 페이지는 위에서 세션이 없으면 로그인 페이지로 리다이렉트하지만,
  // /api/admin/* 는 별도 경로 프리픽스라 그 규칙을 안 타고 각 라우트 자체의
  // requireAdminSession() 체크에만 의존했습니다. 라우트 하나가 그 체크를
  // 빼먹어도 여기서 한 번 더 막히도록 API 레벨에도 세션 검사를 둡니다.
  // 로그인/로그아웃 라우트는 세션이 없거나 이미 만료된 상태에서도 정상적으로
  // 호출될 수 있어야 하므로(로그아웃은 "뭐가 있든 지운다"가 목적) 제외합니다.
  if (
    pathname.startsWith("/api/admin") &&
    pathname !== "/api/admin/login" &&
    pathname !== "/api/admin/logout"
  ) {
    const session = await readAdminSession(req);
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (session.role === "STAFF" && !staffAllowed(pathname)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const session = await readAdminSession(req);
    if (!session) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role === "STAFF" && !staffAllowed(pathname)) {
      // 접근 불가 페이지는 대시보드로 돌려보냅니다.
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    if (pathname === "/account/login" || pathname === "/account/signup") {
      return NextResponse.next();
    }

    const customerId = await getCustomerId(req);
    if (!customerId) return redirectToCustomerLogin(req);
    return NextResponse.next();
  }

  // 채팅과 문의는 항상 신원이 확인된(로그인한) 고객만 이용할 수 있습니다 —
  // 익명 방문자로 대화나 문의가 생기는 경우를 원천적으로 없애기 위함입니다.
  if (pathname.startsWith("/chat") || pathname.startsWith("/contact")) {
    const customerId = await getCustomerId(req);
    if (!customerId) return redirectToCustomerLogin(req);
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/account/:path*", "/chat/:path*", "/contact/:path*"],
};
