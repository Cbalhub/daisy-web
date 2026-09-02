import type { BlogPlatform } from "@prisma/client";

export const BLOG_PLATFORM_LABEL: Record<BlogPlatform, string> = {
  NAVER: "네이버 블로그",
  TISTORY: "티스토리",
  GENERIC: "범용",
};

export const BLOG_PLATFORM_OPTIONS: { value: BlogPlatform; label: string }[] = [
  { value: "NAVER", label: "네이버 블로그" },
  { value: "TISTORY", label: "티스토리" },
  { value: "GENERIC", label: "범용" },
];
