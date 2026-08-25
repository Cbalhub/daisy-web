import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireCustomerSession } from "@/lib/customer-auth";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { limitChatUpload } from "@/lib/ratelimit";
import { MAX_CHAT_FILE_BYTES, detectChatFileExt, randomImageFilename } from "@/lib/upload";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "chat");

// 고객과 관리자 양쪽이 채팅에 파일을 첨부할 수 있어야 하므로, 두 세션 종류를
// 모두 확인하는 공용 업로드 엔드포인트입니다. 실제로 메시지에 연결하는 것은
// 이후 /api/chat/attachment 또는 /api/admin/chats/[id]/attachment가 담당합니다.
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const customerSession = await requireCustomerSession();
  const adminSession = customerSession?.customerId ? null : await requireAdminSession();
  if (!customerSession?.customerId && !adminSession) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 계정 단위로 제한 — 업로드는 디스크에 그대로 쌓이는 무거운 작업이라 텍스트
  // 메시지보다 훨씬 낮은 한도를 둡니다.
  const rateLimitId = customerSession?.customerId ?? `admin:${adminSession!.adminId}`;
  const allowed = await limitChatUpload(rateLimitId);
  if (!allowed) {
    return NextResponse.json({ error: "업로드를 너무 자주 시도했어요. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "첨부할 파일을 선택해 주세요." }, { status: 400 });
  }

  if (file.size > MAX_CHAT_FILE_BYTES) {
    return NextResponse.json({ error: "파일 용량은 50MB 이하만 가능합니다." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = detectChatFileExt(file.type, bytes);
  if (!ext) {
    return NextResponse.json(
      { error: "JPG, PNG, WEBP, GIF, PDF, ZIP 파일만 첨부할 수 있습니다." },
      { status: 400 }
    );
  }

  const filename = randomImageFilename(ext);
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  return NextResponse.json({
    ok: true,
    url: `/uploads/chat/${filename}`,
    name: file.name.slice(0, 200),
    mime: file.type,
  });
}
