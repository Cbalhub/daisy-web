import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";
import { UnreadChatBadge } from "@/components/admin/UnreadChatBadge";
import { AdminLivePoller } from "@/components/admin/AdminLivePoller";
import { markAdminActive } from "@/lib/adminPresence";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  markAdminActive();

  return (
    // 채팅처럼 "화면 높이에 꽉 차고 내부만 스크롤"되는 레이아웃이 h-full 체인을
    // 타고 내려가는 페이지가 있어서, 모바일도 데스크톱과 똑같이 뷰포트 높이로
    // 고정하고 main 안에서만 스크롤되게 합니다(h-dvh는 모바일 주소창 높이 변화도
    // 안전하게 처리). 예전엔 모바일만 min-h-screen(페이지 전체 스크롤)이라 그
    // 체인이 끊겨서 h-full을 쓰는 하위 페이지가 찌그러져 보였습니다.
    <div className="flex h-dvh flex-col overflow-hidden bg-admin-content md:flex-row">
      <AdminLivePoller />
      <Sidebar
        email={session.email ?? ""}
        unreadBadge={
          <Suspense fallback={null}>
            <UnreadChatBadge />
          </Suspense>
        }
      />
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
    </div>
  );
}
