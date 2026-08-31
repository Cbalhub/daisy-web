import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * "2026. 9. 1. 오후 8:11" 형태의 한국 시각 문자열.
 *
 * `Intl.DateTimeFormat("ko-KR", { timeStyle })` 를 그대로 쓰면 서버(Node)의
 * ICU 로케일 데이터에 따라 "오전/오후" 대신 "AM/PM" 으로 나오기도 해서,
 * 서버 렌더와 클라이언트 하이드레이션이 어긋납니다. 숫자 포맷(en-US, 24시간)만
 * ICU 에 맡기고 오전/오후는 직접 붙여 어느 환경에서나 같은 문자열이 되게 합니다.
 * 서버 컴포넌트에서 계산해 문자열로 내려보내는 용도.
 */
export function formatSeoulDateTime(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const hour = Number(parts.hour) % 24;
  const period = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${Number(parts.year)}. ${Number(parts.month)}. ${Number(parts.day)}. ${period} ${hour12}:${parts.minute}`;
}

export function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
