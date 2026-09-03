import { readdir, stat, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { uploadsDir } from "@/lib/upload";

// public/uploads 안에 있지만 DB 어디에서도 참조하지 않는 파일을 지웁니다.
//
// 주 원인: 관리자가 포트폴리오에 이미지 8장을 올린 뒤 3장만 저장하면 나머지 5장이
// 디스크에 그대로 남습니다. 저장 실패·중단도 마찬가지. 이런 파일이 몇 달 쌓이면
// VPS 디스크가 차서 Postgres 쓰기가 실패하고 사이트가 죽을 수 있습니다.
//
// 안전장치: 만든 지 GRACE_MS(기본 24시간) 안 된 파일은 건드리지 않습니다 —
// 방금 업로드하고 아직 저장 화면에 있는 파일을 지우지 않기 위함입니다.

const UPLOAD_ROOT = uploadsDir();
const SUBDIRS = ["portfolio", "events", "chat"] as const;
const GRACE_MS = 24 * 60 * 60 * 1000;

async function referencedUrls(): Promise<Set<string>> {
  const [portfolio, events, messages] = await Promise.all([
    prisma.portfolioItem.findMany({ select: { images: true } }),
    prisma.event.findMany({ select: { imageUrl: true } }),
    prisma.chatMessage.findMany({
      where: { attachmentUrl: { not: null } },
      select: { attachmentUrl: true },
    }),
  ]);

  const set = new Set<string>();
  for (const p of portfolio) for (const url of p.images) set.add(url);
  for (const e of events) if (e.imageUrl) set.add(e.imageUrl);
  for (const m of messages) if (m.attachmentUrl) set.add(m.attachmentUrl);
  return set;
}

export type SweepResult = {
  scanned: number;
  deleted: number;
  freedBytes: number;
  keptRecent: number;
};

export async function sweepOrphanUploads(
  { dryRun = false, now = Date.now() }: { dryRun?: boolean; now?: number } = {}
): Promise<SweepResult> {
  const referenced = await referencedUrls();
  const result: SweepResult = { scanned: 0, deleted: 0, freedBytes: 0, keptRecent: 0 };

  for (const sub of SUBDIRS) {
    const dir = path.join(UPLOAD_ROOT, sub);
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      continue; // 디렉터리가 아직 없으면 넘어갑니다.
    }

    for (const name of names) {
      const abs = path.join(dir, name);
      let info;
      try {
        info = await stat(abs);
      } catch {
        continue;
      }
      if (!info.isFile()) continue;
      result.scanned += 1;

      const url = `/uploads/${sub}/${name}`;
      if (referenced.has(url)) continue;
      if (now - info.mtimeMs < GRACE_MS) {
        result.keptRecent += 1;
        continue;
      }

      if (dryRun) {
        result.deleted += 1;
        result.freedBytes += info.size;
        continue;
      }
      try {
        await unlink(abs);
        result.deleted += 1;
        result.freedBytes += info.size;
      } catch {
        // 경합 등으로 이미 지워졌으면 무시.
      }
    }
  }

  return result;
}
