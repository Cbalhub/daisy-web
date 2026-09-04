import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { estimateGenerateSchema } from "@/lib/validation/estimate";
import { generateEstimate, EstimateError, totalDays } from "@/lib/estimate";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = estimateGenerateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  let generated;
  try {
    generated = await generateEstimate(parsed.data.sourceText);
  } catch (err) {
    if (err instanceof EstimateError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    console.error("[api/admin/estimate] 생성 실패:", err);
    return NextResponse.json({ error: "견적 초안 생성에 실패했습니다." }, { status: 502 });
  }

  const estimate = await prisma.estimate.create({
    data: {
      sourceText: parsed.data.sourceText,
      projectName: generated.projectName,
      summary: generated.summary,
      notes: generated.notes,
      groups: generated.groups as unknown as Prisma.InputJsonValue,
      totalDays: Math.round(totalDays(generated.groups)),
      model: generated.model,
      createdById: session.adminId,
    },
  });

  void prisma.auditLog
    .create({
      data: {
        adminId: session.adminId,
        action: "estimate.generate",
        targetType: "Estimate",
        targetId: estimate.id,
        metadata: { projectName: estimate.projectName, model: estimate.model },
      },
    })
    .catch((e) => console.error("[api/admin/estimate] audit log 실패:", e));

  return NextResponse.json({ ok: true, estimate });
}
