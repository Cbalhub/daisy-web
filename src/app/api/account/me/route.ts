import { NextResponse } from "next/server";
import { requireCustomerSession } from "@/lib/customer-auth";

export const runtime = "nodejs";

// 네비게이션 바의 "로그인/마이페이지" 표시만을 위한 가벼운 엔드포인트입니다.
// 이걸 서버 컴포넌트에서 cookies()로 직접 확인하면 정적으로 미리 렌더링될 수 있었던
// 모든 마케팅 페이지가 요청마다 동적 렌더링으로 바뀌어버리므로, 클라이언트에서
// 마운트 후 한 번만 조회하는 방식을 씁니다.
export async function GET() {
  const session = await requireCustomerSession();
  return NextResponse.json({ loggedIn: Boolean(session) });
}
