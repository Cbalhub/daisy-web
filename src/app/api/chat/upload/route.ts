import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireCustomerSession } from "@/lib/customer-auth";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { limitChatUpload } from "@/lib/ratelimit";
import {
  MAX_CHAT_FILE_BYTES,
  declaredBodyTooLarge,
  safeExtFromName,
  uploadsDir,
} from "@/lib/upload";

export const runtime = "nodejs";

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

  // 본문을 메모리에 올리기 전에 헤더로 먼저 거릅니다(50MB 초과 파일은 파싱 안 함).
  if (declaredBodyTooLarge(req, MAX_CHAT_FILE_BYTES)) {
    return NextResponse.json({ error: "파일 용량은 50MB 이하만 가능합니다." }, { status: 413 });
  }

  // 계정 단위로 제한 — 업로드는 디스크에 그대로 쌓이는 무거운 작업이라 텍스트
  // 메시지보다 훨씬 낮은 한도를 둡니다.
  const rateLimitId = customerSession?.customerId ?? `admin:${adminSession!.adminId}`;
  const allowed = await limitChatUpload(rateLimitId);
  if (!allowed) {
    return NextResponse.json({ error: "업로드를 너무 자주 시도했어요. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  // 사진 여러 장을 한 번에 — "file" 이 여러 개 올 수 있습니다(하위호환: 1개도 그대로 처리).
  const files = (form?.getAll("file") ?? []).filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "첨부할 파일을 선택해 주세요." }, { status: 400 });
  }
  if (files.length > 10) {
    return NextResponse.json({ error: "한 번에 최대 10개까지 보낼 수 있어요." }, { status: 400 });
  }
  if (files.some((f) => f.size > MAX_CHAT_FILE_BYTES)) {
    return NextResponse.json({ error: "파일 용량은 50MB 이하만 가능합니다." }, { status: 400 });
  }

  const dir = uploadsDir("chat");
  await mkdir(dir, { recursive: true });

  const saved: { url: string; name: string; mime: string }[] = [];
  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    // 형식 제한 없음 — 저장 파일명은 UUID + 원본에서 뽑은 안전한 확장자.
    // 실행/렌더 위험은 nginx 가 /uploads/ 를 attachment(octet-stream)로만 서빙해 차단.
    const ext = safeExtFromName(file.name);
    const filename = ext ? `${randomUUID()}.${ext}` : randomUUID();
    await writeFile(path.join(dir, filename), bytes);
    saved.push({
      url: `/uploads/chat/${filename}`,
      name: file.name.slice(0, 200),
      mime: file.type,
    });
  }

  // files: 항상 배열. url/name/mime: 첫 항목(하위호환).
  return NextResponse.json({ ok: true, files: saved, ...saved[0] });
}
