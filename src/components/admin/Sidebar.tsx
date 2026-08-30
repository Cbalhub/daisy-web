"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DaisyAsterisk } from "@/components/marketing/DaisyAsterisk";
import {
  IconGrid,
  IconCard,
  IconImage,
  IconChart,
  IconChat,
  IconUsers,
  IconLogout,
  IconExternal,
  IconMenu,
  IconClose,
  IconStar,
  IconBolt,
  IconCalendar,
  IconSettings,
  IconTag,
  IconHelp,
} from "@/components/admin/icons";

const NAV = [
  { href: "/admin", label: "대시보드", icon: IconGrid, exact: true },
  { href: "/admin/chats", label: "채팅", icon: IconChat },
  { href: "/admin/orders", label: "주문 · 결제", icon: IconCard },
  { href: "/admin/ledger", label: "장부", icon: IconCalendar },
  { href: "/admin/customers", label: "고객", icon: IconUsers },
  { href: "/admin/portfolio", label: "포트폴리오", icon: IconImage },
  { href: "/admin/reviews", label: "후기", icon: IconStar },
  { href: "/admin/event", label: "이벤트", icon: IconTag },
  { href: "/admin/quick-replies", label: "빠른 답변", icon: IconBolt },
  { href: "/admin/analytics", label: "분석", icon: IconChart },
  { href: "/admin/help", label: "세금 도움말", icon: IconHelp },
  { href: "/admin/settings", label: "설정", icon: IconSettings },
];

export function Sidebar({
  email,
  unreadBadge,
}: {
  email: string;
  unreadBadge?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // 좁은 화면에서는 사이드바가 콘텐츠 영역을 다 차지해버리므로, md 미만에서는
  // 상단 바 + 슬라이드 드로어로 전환합니다.
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  // 컴포넌트가 아니라 JSX를 반환하는 일반 함수입니다 — 데스크톱/모바일 드로어가
  // 상태 없이 같은 마크업을 공유하기 위한 용도로, 컴포넌트로 선언하면 매 렌더링마다
  // 새로 "생성"되어 리마운트(및 애니메이션 상태 초기화)가 발생하므로 함수 호출로 둡니다.
  function renderNavLinks(onNavigate?: () => void) {
    return (
      <nav className="flex-1 space-y-0.5 px-3">
        <p className="px-2.5 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-admin-sidebar-text">
          Menu
        </p>
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-admin-blue-soft text-admin-blue"
                  : "text-admin-sidebar-text hover:bg-admin-bg-soft hover:text-admin-text"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
              {item.href === "/admin/chats" && unreadBadge}
            </Link>
          );
        })}
      </nav>
    );
  }

  function renderFooter(onNavigate?: () => void) {
    return (
      <>
        <div className="space-y-0.5 border-t border-admin-sidebar-line px-3 py-3">
          <Link
            href="/"
            target="_blank"
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-admin-sidebar-text transition-colors hover:bg-admin-bg-soft hover:text-admin-text"
          >
            <IconExternal className="h-4 w-4 shrink-0" />
            사이트 보기
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-admin-sidebar-text transition-colors hover:bg-admin-bg-soft hover:text-admin-text"
          >
            <IconLogout className="h-4 w-4 shrink-0" />
            로그아웃
          </button>
        </div>
        <div className="border-t border-admin-sidebar-line px-5 py-4">
          <p className="truncate text-xs text-admin-sidebar-text">{email}</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* 모바일 상단 바 */}
      <div className="flex items-center justify-between border-b border-admin-sidebar-line bg-admin-bg px-4 py-3 text-admin-text md:hidden">
        <span className="flex items-center gap-1.5 font-display text-base font-semibold">
          <DaisyAsterisk variant="color" className="h-5 w-5" />
          Daisy
        </span>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="메뉴 열기"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-admin-sidebar-text transition-colors hover:bg-admin-bg-soft hover:text-admin-text"
        >
          <IconMenu className="h-5 w-5" />
        </button>
      </div>

      {/* 데스크톱 사이드바 */}
      <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-admin-sidebar-line bg-admin-bg text-admin-text md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <DaisyAsterisk variant="color" className="h-6 w-6" />
          <span className="font-display text-lg font-semibold">
            Daisy
          </span>
          <span className="rounded-full bg-admin-bg-soft px-2 py-0.5 text-[10px] font-medium text-admin-sidebar-text">
            Admin
          </span>
        </div>
        {renderNavLinks()}
        {renderFooter()}
      </aside>

      {/* 모바일 드로어 */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col bg-admin-bg text-admin-text md:hidden"
            >
              <div className="flex items-center justify-between px-5 py-5">
                <span className="flex items-center gap-2 font-display text-lg font-semibold">
                  <DaisyAsterisk variant="color" className="h-6 w-6" />
                  Daisy
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="메뉴 닫기"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-admin-sidebar-text hover:bg-admin-bg-soft hover:text-admin-text"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
              {renderNavLinks(() => setMobileOpen(false))}
              {renderFooter(() => setMobileOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
