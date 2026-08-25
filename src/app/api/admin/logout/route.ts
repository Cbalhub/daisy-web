import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await getSession();
  session.destroy();
  await session.save();

  return NextResponse.json({ ok: true });
}
