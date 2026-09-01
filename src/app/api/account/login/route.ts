import { NextRequest, NextResponse } from "next/server";
import { customerLoginSchema } from "@/lib/validation/customer";
import { verifyCustomerCredentials } from "@/lib/customer-auth";
import { getCustomerSession } from "@/lib/customer-session";
import { prisma } from "@/lib/prisma";
import { limitLoginAttempt } from "@/lib/ratelimit";
import { isSameOrigin } from "@/lib/csrf";
import { clientIp } from "@/lib/request-ip";

export const runtime = "nodejs";

function getClientIp(req: NextRequest) {
  return clientIp(req) ?? "unknown";
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const allowed = await limitLoginAttempt(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }

  const parsed = customerLoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "이메일과 비밀번호를 확인해 주세요." }, { status: 400 });
  }

  const customer = await verifyCustomerCredentials(parsed.data.email, parsed.data.password);
  if (!customer) {
    return NextResponse.json(
      { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  await prisma.auditLog.create({
    data: {
      action: "customer.login",
      targetType: "Customer",
      targetId: customer.id,
      metadata: { ip },
    },
  });

  const session = await getCustomerSession();
  session.customerId = customer.id;
  session.email = customer.email;
  await session.save();

  return NextResponse.json({ ok: true });
}
