import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validation/event";
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

  const parsed = eventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({ data: parsed.data });

  // 마케팅 레이아웃(팝업)은 정적으로 미리 만들어져 있어서, 여기서 명시적으로
  // 다시 생성하라고 알려주지 않으면 방금 추가한 이벤트가 반영 안 됩니다.
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, event });
}
