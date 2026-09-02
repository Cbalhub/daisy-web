import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CLOSED"]),
});

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const { count } = await prisma.inquiry.updateMany({
    where: { id: { in: parsed.data.ids } },
    data: { status: parsed.data.status },
  });

  void prisma.auditLog
    .create({
      data: {
        adminId: session.adminId,
        action: "inquiry.bulk_status",
        targetType: "Inquiry",
        targetId: parsed.data.ids[0],
        metadata: { count, status: parsed.data.status, ids: parsed.data.ids },
      },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true, count });
}
