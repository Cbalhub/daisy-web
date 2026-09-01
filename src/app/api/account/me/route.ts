import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

// 네비게이션 바의 "로그인/마이페이지" 표시만을 위한 가벼운 엔드포인트입니다.
// 세션 쿠키에 customerId 가 있어도, 그 고객이 실제로 DB 에 존재하는지 확인합니다 —
// 계정이 삭제됐는데 세션만 남은 경우 nav 는 "마이페이지"로 보이지만 클릭하면
// 로그인으로 튕기는 어긋난 상태가 생기므로, 여기서 세션을 정리합니다.
export async function GET() {
  const session = await getCustomerSession();
  if (!session.customerId) {
    return NextResponse.json({ loggedIn: false });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { id: true },
  });

  if (!customer) {
    session.destroy();
    await session.save();
    return NextResponse.json({ loggedIn: false });
  }

  return NextResponse.json({ loggedIn: true });
}
