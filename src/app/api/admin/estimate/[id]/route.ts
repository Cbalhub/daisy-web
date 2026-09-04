import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { estimateUpdateSchema } from "@/lib/validation/estimate";
import { normalizeGroups, totalDays } from "@/lib/estimate";

export const runtime = "nodejs";

async function guard(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return { error: NextResponse.json({ error: "invalid origin" }, { status: 403 }) };
  }
  const session = await requireAdminSession();
  if (!session) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const { id } = await params;

  const parsed = estimateUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const data: Prisma.EstimateUpdateInput = {};
  if (parsed.data.projectName !== undefined) data.projectName = parsed.data.projectName;
  if (parsed.data.summary !== undefined) data.summary = parsed.data.summary;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
  if (parsed.data.groups !== undefined) {
    const groups = normalizeGroups(parsed.data.groups);
    data.groups = groups as unknown as Prisma.InputJsonValue;
    data.totalDays = Math.round(totalDays(groups));
  }

  const estimate = await prisma.estimate.update({ where: { id }, data }).catch(() => null);
  if (!estimate) return NextResponse.json({ error: "견적을 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json({ ok: true, estimate });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return g.error;
  const { id } = await params;
  await prisma.estimate.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
