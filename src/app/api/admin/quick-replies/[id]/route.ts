import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quickReplySchema } from "@/lib/validation/quickReply";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = quickReplySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const { id } = await params;
  const quickReply = await prisma.quickReply.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true, quickReply });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.quickReply.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
