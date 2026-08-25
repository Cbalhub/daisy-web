import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";
import { renderQuoteImage } from "@/lib/quote-image";

export const runtime = "nodejs";

// /pay/[orderToken] 결제 페이지와 같은 신뢰 모델입니다 — orderToken 자체가
// 추측 불가능한 값이라, 이 링크를 아는 사람(=결제 요청을 받은 고객)만
// 볼 수 있으면 충분하고 별도 로그인 확인은 두지 않습니다.
export async function GET(req: NextRequest, { params }: { params: Promise<{ orderToken: string }> }) {
  const { orderToken } = await params;
  const order = await prisma.order.findUnique({ where: { orderToken } });
  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  const settings = await getBusinessSettings();
  return renderQuoteImage(order, settings);
}
