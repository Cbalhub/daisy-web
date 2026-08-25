import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-session";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await getCustomerSession();
  session.destroy();
  await session.save();

  return NextResponse.json({ ok: true });
}
