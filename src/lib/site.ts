// 사이트 절대 URL — 사이트맵·robots·메타데이터·JSON-LD가 공유하는 단일 소스.
// 배포 환경에서는 SITE_URL 을 실제 도메인으로 설정하세요(끝에 / 없이).
// 값이 없으면 프로덕션 도메인으로 폴백합니다.
const FALLBACK = "https://overcook.kr";

export const SITE_URL = (process.env.SITE_URL || FALLBACK).replace(/\/+$/, "");

export const SITE_NAME = "Daisy";

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
