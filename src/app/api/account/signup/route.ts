import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { customerSignupSchema } from "@/lib/validation/customer";
import { createCustomer } from "@/lib/customer-auth";
import { getCustomerSession } from "@/lib/customer-session";
import { prisma } from "@/lib/prisma";
import { limitLoginAttempt } from "@/lib/ratelimit";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

function getClientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const allowed = await limitLoginAttempt(ip);
  if (!allowed) {
    return NextResponse.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const parsed = customerSignupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  try {
    const customer = await createCustomer({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name || undefined,
      phone: parsed.data.phone || undefined,
    });

    await prisma.auditLog.create({
      data: {
        action: "customer.signup",
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
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
    }
    throw err;
  }
}
