import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

const bodySchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

// 계약서를 무효 처리합니다. 잘못 발송했거나, 서명이 이상하다고 판단될 때
// (예: 링크 유출로 인한 가짜 서명) 사용합니다. 이미 무효인 건 그대로 둡니다.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }
  const session = await requireAdminSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  const reason = parsed.success ? parsed.data.reason || null : null;

  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) {
    return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
  }
  if (contract.status === "VOID") {
    return NextResponse.json({ error: "이미 무효 처리된 계약서입니다." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.contract.update({ where: { id: contract.id }, data: { status: "VOID" } });
    await tx.auditLog.create({
      data: {
        adminId: session.adminId,
        action: "contract.void",
        targetType: "Contract",
        targetId: contract.id,
        metadata: {
          orderId: contract.orderId,
          previousStatus: contract.status,
          signedName: contract.signedName,
          reason,
        },
      },
    });
  });

  return NextResponse.json({ ok: true });
}
