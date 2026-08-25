import { prisma } from "@/lib/prisma";

// Sidebar(클라이언트 컴포넌트)에 슬롯으로 꽂히는 서버 컴포넌트입니다 —
// 이 카운트 조회가 관리자 대시보드 전체 네비게이션을 막지 않도록, 부모
// 레이아웃이 이 컴포넌트를 await하지 않고 Suspense로 감싸서 렌더링합니다.
export async function UnreadChatBadge() {
  const count = await prisma.chatMessage.count({
    where: { sender: "VISITOR", read: false },
  });
  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-admin-blue px-1.5 text-[10px] font-semibold text-white">
      {count}
    </span>
  );
}
