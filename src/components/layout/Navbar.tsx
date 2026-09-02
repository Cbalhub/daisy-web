"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { openChatWidget } from "@/components/chat/openChat";
import { Wordmark } from "@/components/brand/Wordmark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

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

  // 로그인 여부는 클라이언트에서 조회합니다(서버 컴포넌트 cookies()로 확인하면
  // 마케팅 페이지들이 정적 프리렌더가 안 됨). 마운트뿐 아니라 ① 경로가 바뀔 때
  // ② 로그인/로그아웃 이벤트가 올 때 다시 확인해서, 로그아웃했는데 nav 는
  // "마이페이지"로 남아있는 어긋남을 없앱니다.
  //
  // 새로고침마다 /api/account/me 왕복 동안 "로그인"이 잠깐 떴다 "마이페이지"로
  // 바뀌는 깜빡임이 있어서, 마지막으로 확인된 값을 localStorage 에 캐시해 두고
  // 마운트 직후(마이크로태스크) 즉시 반영합니다. 서버 렌더는 항상 false 라
  // 하이드레이션 불일치가 없고, 마이크로태스크는 페인트 전에 실행돼 사용자는
  // 깜빡임을 거의 못 봅니다. fetch 결과가 오면 캐시를 갱신·보정합니다.
  const AUTH_CACHE_KEY = "movd-auth";
  useEffect(() => {
    let alive = true;

    Promise.resolve().then(() => {
      if (!alive) return;
      try {
        const cached = localStorage.getItem(AUTH_CACHE_KEY);
        if (cached === "1" || cached === "0") setLoggedIn(cached === "1");
      } catch {
        // 저장소 접근 불가 — fetch 결과만 사용.
      }
    });

    const check = () => {
      fetch("/api/account/me")
        .then((res) => res.json())
        .then((data) => {
          if (!alive) return;
          const value = Boolean(data.loggedIn);
          setLoggedIn(value);
          try {
            localStorage.setItem(AUTH_CACHE_KEY, value ? "1" : "0");
          } catch {
            // 무시.
          }
        })
        .catch(() => {});
    };
    check();
    window.addEventListener("movd-auth-change", check);
    return () => {
      alive = false;
      window.removeEventListener("movd-auth-change", check);
    };
  }, [pathname]);

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
          "mx-auto flex max-w-[64rem] items-center justify-between rounded-2xl border border-line bg-paper/85 px-4 py-2.5 backdrop-blur-md transition-shadow duration-200 md:px-5",
          scrolled ? "shadow-[var(--shadow-e2)]" : "shadow-[var(--shadow-e1)]"
        )}
      >
        <Wordmark className="text-[22px]" />

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap text-sm text-ink-soft transition-colors hover:text-ink",
                pathname === link.href && "text-ink"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/account"
            className="whitespace-nowrap text-sm text-ink-soft transition-colors hover:text-ink"
          >
            {loggedIn ? "마이페이지" : "로그인"}
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={openChatWidget}
            className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-[10px] bg-accent px-4 text-sm font-semibold text-on-accent shadow-[var(--shadow-e1)] transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-px hover:bg-accent-bright hover:shadow-[var(--shadow-e2)] active:translate-y-px active:shadow-none active:duration-100"
          >
            프로젝트 문의
          </button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle className="!border-0" />
          <button
            className="-mr-1 flex h-10 w-10 flex-col items-center justify-center gap-[5px]"
            onClick={() => setOpen((v) => !v)}
            aria-label="메뉴"
            aria-expanded={open}
          >
            {/* 햄버거 → X 전환은 CSS transform 만으로. framer-motion 을 네비게이션에서
                걷어내 모든 페이지의 공통 JS 에서 애니메이션 라이브러리를 뺐습니다. */}
            <span
              className={cn(
                "h-px w-5 origin-center bg-ink transition-transform duration-200 ease-out motion-reduce:transition-none",
                open && "translate-y-[6px] rotate-45"
              )}
            />
            <span
              className={cn(
                "h-px w-5 bg-ink transition-opacity duration-200 ease-out motion-reduce:transition-none",
                open && "opacity-0"
              )}
            />
            <span
              className={cn(
                "h-px w-5 origin-center bg-ink transition-transform duration-200 ease-out motion-reduce:transition-none",
                open && "-translate-y-[6px] -rotate-45"
              )}
            />
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 — grid-rows 0fr↔1fr 트릭으로 "높이 auto" 를 CSS 만으로 접었다 폅니다. */}
      <div
        className={cn(
          "mx-auto grid max-w-[64rem] overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] md:hidden motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden pt-2">
          <nav
            inert={!open}
            className="rounded-2xl border border-line bg-paper shadow-[var(--shadow-e1)]"
          >
            <div className="flex flex-col p-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center rounded-lg px-3 text-[15px] text-ink-soft transition-colors hover:bg-paper-dim hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/account"
                className="flex min-h-11 items-center rounded-lg px-3 text-[15px] text-ink-soft transition-colors hover:bg-paper-dim hover:text-ink"
              >
                {loggedIn ? "마이페이지" : "로그인"}
              </Link>
              <button
                type="button"
                onClick={openChatWidget}
                className="mt-1 flex min-h-11 items-center rounded-lg bg-accent px-3 text-left text-[15px] font-semibold text-on-accent"
              >
                프로젝트 문의
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
