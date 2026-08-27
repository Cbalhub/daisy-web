"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { openChatWidget } from "@/components/chat/openChat";
import { DaisyAsterisk } from "@/components/marketing/DaisyAsterisk";

const NAV_LINKS = [
  { href: "/services", label: "서비스" },
  { href: "/portfolio", label: "포트폴리오" },
  { href: "/reviews", label: "후기" },
  { href: "/faq", label: "FAQ" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // 로그인 여부는 클라이언트에서 마운트 후 한 번만 조회합니다. 서버 컴포넌트에서
  // cookies()로 확인하면 이 컴포넌트를 쓰는 모든 마케팅 페이지가 정적으로
  // 미리 렌더링되지 못하고 매 요청마다 동적 렌더링으로 바뀌기 때문입니다.
  useEffect(() => {
    fetch("/api/account/me")
      .then((res) => res.json())
      .then((data) => setLoggedIn(Boolean(data.loggedIn)))
      .catch(() => {});
  }, []);

  // 경로가 바뀌면 모바일 메뉴를 닫습니다. effect 대신 렌더링 중 상태를 맞춰
  // 불필요한 추가 렌더링(cascading render)을 피합니다.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 md:px-6 md:pt-4">
      <div
        className={cn(
          "mx-auto flex max-w-[68rem] items-center justify-between rounded-3xl px-5 py-3 backdrop-blur-md transition-shadow duration-300 md:px-7",
          scrolled
            ? "border border-line bg-paper/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_32px_-20px_rgba(15,23,42,0.25)]"
            : "border border-transparent bg-paper/70"
        )}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <DaisyAsterisk variant="color" className="h-6 w-6" />
          <span className="font-display text-xl font-bold tracking-tight text-ink">Daisy</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium text-ink-soft transition-colors hover:text-ink",
                pathname === link.href && "text-ink"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/account"
            className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            {loggedIn ? "마이페이지" : "로그인"}
          </Link>
          <button
            type="button"
            onClick={openChatWidget}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-5 text-[15px] font-semibold text-white transition-[transform,opacity,filter] duration-200 ease-out hover:opacity-90 active:scale-[0.97] active:brightness-90 active:duration-100"
          >
            프로젝트 문의
          </button>
        </div>

        <button
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴 열기"
          aria-expanded={open}
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0, y: open ? 6 : 0 }}
            className="h-px w-6 bg-ink"
          />
          <motion.span
            animate={{ opacity: open ? 0 : 1 }}
            className="h-px w-6 bg-ink"
          />
          <motion.span
            animate={{ rotate: open ? -45 : 0, y: open ? -6 : 0 }}
            className="h-px w-6 bg-ink"
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto mt-2 max-w-[68rem] overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_32px_-20px_rgba(15,23,42,0.25)] md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-2.5 text-base font-medium text-ink-soft hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/account"
                className="py-2.5 text-base font-medium text-ink-soft hover:text-ink"
              >
                {loggedIn ? "마이페이지" : "로그인"}
              </Link>
              <button
                type="button"
                onClick={openChatWidget}
                className="py-2.5 text-left text-base font-medium text-accent"
              >
                프로젝트 문의
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
