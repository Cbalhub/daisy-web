import Link from "next/link";
import { cn } from "@/lib/utils";

type Common = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xl" | "lg" | "md" | "s";
  className?: string;
  children: React.ReactNode;
};

// 토스 디자인 시스템의 버튼 스펙을 구조적으로 따릅니다 — 사이즈마다 높이·모서리
// 반경·라벨 굵기가 함께 스케일되고(XL 56/16px/17px, L 48/14px/17px, M 40/12px/15px,
// S 32/10px/13px), 눌렀을 때는 scale이 아니라 어두워지는 오버레이 방식,
// disabled는 부분 회색 처리 대신 전체 노드에 30% opacity를 씁니다. 색 자체는
// 아직 확정 전이라 기존 accent/paper-dim/error 토큰을 그대로 사용합니다.
const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-[transform,background-color,color,box-shadow,border-color,filter] duration-200 ease-out active:scale-[0.97] active:brightness-90 active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-30";

const variants = {
  primary: "bg-accent text-white hover:opacity-90",
  secondary: "bg-paper-dim text-ink hover:opacity-80",
  ghost: "text-accent hover:opacity-70",
  danger: "bg-error text-white hover:opacity-90",
};

const sizes = {
  xl: "h-14 rounded-2xl px-6 text-[17px] font-bold",
  lg: "h-12 rounded-[14px] px-5 text-[17px] font-bold",
  md: "h-10 rounded-xl px-4 text-[15px] font-semibold",
  s: "h-8 rounded-[10px] px-3 text-[13px] font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: Common & ({ href: string } & Omit<React.ComponentProps<typeof Link>, "href">)) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

export function ButtonEl({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
