import "server-only";
import { prisma } from "@/lib/prisma";

export type EventStyle = "dark" | "light" | "festive";
const VALID_STYLES: readonly EventStyle[] = ["dark", "light", "festive"];

// Prisma는 style을 그냥 string으로 저장하므로(스키마에서 zod enum으로 쓰기 입력만
// 제한), 읽을 때 유효한 값인지 확인하고 아니면 기본값(dark)으로 보정합니다.
function normalizeStyle(style: string): EventStyle {
  return (VALID_STYLES as readonly string[]).includes(style) ? (style as EventStyle) : "dark";
}

/**
 * 방문자 팝업에 실제로 보여줄 이벤트들 — 켜져 있는 것만, 노출 순서대로.
 */
export async function getActiveEvents() {
  const events = await prisma.event.findMany({
    where: { enabled: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return events.map((e) => ({ ...e, style: normalizeStyle(e.style) }));
}

/**
 * 관리자 목록 화면용 — 꺼진 것도 포함해 전부 보여줍니다.
 */
export async function listAllEvents() {
  const events = await prisma.event.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return events.map((e) => ({ ...e, style: normalizeStyle(e.style) }));
}
