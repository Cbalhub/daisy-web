import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { BCRYPT_COST } from "@/lib/hash";

export const runtime = "nodejs";

const schema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해 주세요."),
  newPassword: z.string().min(8, "새 비밀번호는 8자 이상이어야 합니다.").max(200),
});

// 관리자 본인 비밀번호 변경. 현재 비밀번호 확인 후 교체.
export async function PATCH(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }
  const session = await requireAdminSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: session.adminId } });
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "현재 비밀번호가 올바르지 않습니다." }, { status: 400 });
  }
  if (parsed.data.newPassword === parsed.data.currentPassword) {
    return NextResponse.json({ error: "새 비밀번호가 현재와 같습니다." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_COST);
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash } }),
    prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "admin.password_change",
        targetType: "AdminUser",
        targetId: admin.id,
        metadata: {},
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
