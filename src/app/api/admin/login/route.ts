import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
import { verifyAdminCredentials } from "@/lib/auth";
import { getSession } from "@/lib/session";
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
    return NextResponse.json(
      { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "이메일과 비밀번호를 확인해 주세요." }, { status: 400 });
  }

  const admin = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
  if (!admin) {
    return NextResponse.json(
      { error: "이메일 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const session = await getSession();
  session.adminId = admin.id;
  session.email = admin.email;
  await session.save();

  return NextResponse.json({ ok: true });
}
