import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { uploadsDir } from "@/lib/upload";
import { Readable } from "stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 프로덕션에서는 nginx 의 `location /uploads/` 가 이 요청을 먼저 가로채 디스크에서
// 직접 서빙합니다. 이 라우트는 (a) 로컬 개발, (b) next/image 최적화기가 내부에서
// /uploads/* 를 가져올 때의 폴백입니다. nginx 와 동일하게 이미지만 inline, 나머지는
// 다운로드(attachment)로 내려줍니다.

const INLINE_IMAGE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  // 경로 세그먼트 화이트리스트 — 상위 이동·구분자 주입 차단.
  if (!parts.length || parts.some((p) => !/^[a-zA-Z0-9._-]+$/.test(p) || p === "..")) {
    return new NextResponse("bad request", { status: 400 });
  }
  const abs = path.join(uploadsDir(), ...parts);
  const root = uploadsDir();
  if (!abs.startsWith(root + path.sep)) {
    return new NextResponse("bad request", { status: 400 });
  }

  let size: number;
  try {
    const info = await stat(abs);
    if (!info.isFile()) throw new Error("not a file");
    size = info.size;
  } catch {
    return new NextResponse("not found", { status: 404 });
  }

  const ext = (path.extname(abs).slice(1) || "").toLowerCase();
  const imageType = INLINE_IMAGE[ext];
  const headers: Record<string, string> = {
    "Content-Type": imageType || "application/octet-stream",
    "Content-Length": String(size),
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=604800",
  };
  if (!imageType) headers["Content-Disposition"] = "attachment";

  const nodeStream = createReadStream(abs);
  return new NextResponse(Readable.toWeb(nodeStream) as ReadableStream, { headers });
}
