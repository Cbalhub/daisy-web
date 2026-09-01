import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import {
  MAX_IMAGES_PER_REQUEST,
  MAX_IMAGE_BYTES,
  declaredBodyTooLarge,
  detectImageExt,
  randomImageFilename,
} from "@/lib/upload";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "portfolio");

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 본문을 메모리에 올리기 전에 선반영 — 8MB × 8장을 넘는 요청은 파싱 자체를 안 합니다.
  if (declaredBodyTooLarge(req, MAX_IMAGE_BYTES * MAX_IMAGES_PER_REQUEST)) {
    return NextResponse.json({ error: "업로드 용량이 너무 큽니다." }, { status: 413 });
  }

  const form = await req.formData().catch(() => null);
  const files = form?.getAll("files").filter((f): f is File => f instanceof File) ?? [];

  if (files.length === 0) {
    return NextResponse.json({ error: "첨부할 이미지를 선택해 주세요." }, { status: 400 });
  }
  if (files.length > MAX_IMAGES_PER_REQUEST) {
    return NextResponse.json(
      { error: `한 번에 최대 ${MAX_IMAGES_PER_REQUEST}장까지 업로드할 수 있습니다.` },
      { status: 400 }
    );
  }

  const urls: string[] = [];

  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `${file.name}: 파일 용량은 8MB 이하만 가능합니다.` },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = detectImageExt(file.type, bytes);
    if (!ext) {
      return NextResponse.json(
        { error: `${file.name}: JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다.` },
        { status: 400 }
      );
    }

    const filename = randomImageFilename(ext);
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), bytes);
    urls.push(`/uploads/portfolio/${filename}`);
  }

  return NextResponse.json({ ok: true, urls });
}
