import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendTelegramText } from "@/lib/telegram";
import { sendDiscordText } from "@/lib/discord";

export const runtime = "nodejs";

const schema = z.object({
  id: z.string().min(1),
  platform: z.enum(["NAVER", "TISTORY"]),
  ok: z.boolean(),
  url: z.string().url().max(500).optional(),
  error: z.string().max(1000).optional(),
});

// 로컬 퍼블리셔가 발행 결과를 돌려줍니다.
export async function POST(req: NextRequest) {
  const secret = process.env.PUBLISHER_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "publisher disabled" }, { status: 404 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const { id, platform, ok, url, error } = parsed.data;

  const draft = await prisma.blogDraft.findUnique({ where: { id }, select: { publishLog: true } });
  if (!draft) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isNaver = platform === "NAVER";
  const stateField = isNaver ? "naverState" : "tistoryState";
  const urlField = isNaver ? "naverUrl" : "tistoryUrl";
  const errorField = isNaver ? "naverError" : "tistoryError";

  const prevLog = Array.isArray(draft.publishLog) ? (draft.publishLog as unknown[]) : [];
  const entry = {
    at: new Date().toISOString(),
    platform,
    state: ok ? "PUBLISHED" : "FAILED",
    note: ok ? url ?? "" : error ?? "",
  };

  const updated = await prisma.blogDraft.update({
    where: { id },
    data: {
      [stateField]: ok ? "PUBLISHED" : "FAILED",
      [urlField]: ok ? url ?? "" : undefined,
      [errorField]: ok ? "" : (error ?? "발행 실패").slice(0, 1000),
      publishLog: [...prevLog, entry].slice(-20) as Prisma.InputJsonValue,
    },
    select: { title: true },
  });

  if (!ok) {
    const label = platform === "NAVER" ? "네이버 블로그" : "티스토리";
    const line = `⚠️ 블로그 발행 실패 — ${label}\n${updated.title || id}\n${(error ?? "").slice(0, 300)}`;
    const site = process.env.SITE_URL ?? "https://movd.co.kr";
    void Promise.allSettled([
      sendTelegramText(line, { url: `${site}/admin/blog/${id}`, urlLabel: "초안 열기" }),
      sendDiscordText(line, { url: `${site}/admin/blog/${id}`, urlLabel: "초안 열기" }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
