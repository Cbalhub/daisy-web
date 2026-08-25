import { NextRequest, NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/validation/order";
import { createOrder } from "@/lib/payment-service";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const { expiresInDays, description, customerPhone, businessRegNo, ...rest } = parsed.data;

  const order = await createOrder({
    ...rest,
    description: description || undefined,
    customerPhone: customerPhone || undefined,
    businessRegNo: businessRegNo || undefined,
    expiresAt: expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined,
    createdById: session.adminId,
  });

  return NextResponse.json({ ok: true, order });
}
