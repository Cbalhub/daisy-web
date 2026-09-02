"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
    // 네비게이션 바가 즉시 "로그인"으로 바뀌도록: 캐시를 먼저 지우고 이벤트로 알림.
    try {
      localStorage.setItem("movd-auth", "0");
    } catch {
      // 무시.
    }
    window.dispatchEvent(new Event("movd-auth-change"));
    router.replace("/");
  }

  return (
    <button
      onClick={logout}
      className="text-sm font-medium text-muted underline decoration-line underline-offset-4 hover:text-ink hover:decoration-accent"
    >
      로그아웃
    </button>
  );
}
