import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { eventUpdateSchema } from "@/lib/validation/event";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { deleteUploadByUrl } from "@/lib/upload";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = eventUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const { id } = await params;
  const before = await prisma.event.findUnique({ where: { id }, select: { imageUrl: true } });
  const event = await prisma.event.update({ where: { id }, data: parsed.data });

  // 배너 이미지를 바꿨거나 텍스트 배너로 되돌렸으면 옛 파일을 지웁니다.
  if (before?.imageUrl && before.imageUrl !== event.imageUrl) {
    await deleteUploadByUrl(before.imageUrl);
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, event });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const removed = await prisma.event
    .findUnique({ where: { id }, select: { imageUrl: true } })
    .then((e) => e?.imageUrl);
  await prisma.event.delete({ where: { id } });
  await deleteUploadByUrl(removed);

  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
