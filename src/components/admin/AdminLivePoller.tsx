"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 채팅방을 직접 열어서 보고 있을 때는 ChatThread의 SSE가 새 메시지를 실시간으로
// 밀어주지만, 대시보드나 채팅 목록처럼 특정 대화를 열지 않은 화면에 그냥
// 머물러 있을 때는 그걸 들을 곳이 없어서 사이드바 뱃지·목록이 갱신되지
// 않았습니다. 어드민 레이아웃 전체에서 /api/admin/chats/stream(서버가 3초
// 주기로 DB를 확인하다 변경을 감지하면 즉시 밀어주는 신호 전용 스트림)을
// 구독해, 새 메시지나 읽음 상태 변화가 생기는 즉시 router.refresh()로
// 현재 화면을 다시 가져옵니다 — 정해진 간격을 기다리는 폴링이 아니라
// 서버가 감지하는 대로 푸시되는 방식입니다.
export function AdminLivePoller() {
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource("/api/admin/chats/stream");
    source.addEventListener("update", () => router.refresh());
    return () => source.close();
  }, [router]);

  return null;
}
