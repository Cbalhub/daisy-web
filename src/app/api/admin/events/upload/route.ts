import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import {
  MAX_IMAGE_BYTES,
  declaredBodyTooLarge,
  detectImageExt,
  randomImageFilename,
  uploadsDir,
} from "@/lib/upload";

export const runtime = "nodejs";

const UPLOAD_DIR = uploadsDir("events");

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (declaredBodyTooLarge(req, MAX_IMAGE_BYTES)) {
    return NextResponse.json({ error: "파일 용량은 8MB 이하만 가능합니다." }, { status: 413 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "첨부할 이미지를 선택해 주세요." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "파일 용량은 8MB 이하만 가능합니다." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExt(file.type, bytes);
  if (!ext) {
    return NextResponse.json(
      { error: "JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다." },
      { status: 400 }
    );
  }

  const filename = randomImageFilename(ext);
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  return NextResponse.json({ ok: true, url: `/uploads/events/${filename}` });
}
