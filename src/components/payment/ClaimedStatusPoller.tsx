"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 12_000;

// 입금 확인 대기 중에는 관리자가 언제 확인 처리할지 알 수 없어서, 고객이
// 직접 새로고침하지 않아도 상태가 바뀌면 화면에 반영되도록 주기적으로
// 서버 컴포넌트를 다시 조회합니다. 상태가 PAYMENT_CLAIMED를 벗어나면 이
// 컴포넌트 자체가 더 이상 렌더링되지 않아 자연스럽게 폴링이 멈춥니다.
export function ClaimedStatusPoller() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
