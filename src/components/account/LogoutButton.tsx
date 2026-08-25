"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
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
