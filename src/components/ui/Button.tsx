import Link from "next/link";
import { cn } from "@/lib/utils";

type Common = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xl" | "lg" | "md" | "s";
  className?: string;
  children: React.ReactNode;
};

// 사이즈마다 높이·라벨 굵기가 함께 스케일됩니다. 눌렀을 때는 scale이 아니라
// 어두워지는 오버레이, disabled는 전체 노드 30% opacity. modern-minimal 재디자인에서
// 모서리 반경을 10px로 낮추고(Linear/Vercel 계열의 절제된 pill), 라벨은 항상 한 줄로
// 유지합니다(whitespace-nowrap — 좁은 화면에서 두 줄 깨짐 방지).
const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,color,box-shadow,border-color,filter] duration-200 ease-out active:translate-y-px active:brightness-95 active:shadow-none active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-30";

const variants = {
  primary:
    "bg-accent text-on-accent shadow-[var(--shadow-e1)] hover:bg-accent-bright hover:shadow-[var(--shadow-e2)] hover:-translate-y-px",
  secondary:
    "border border-line bg-paper text-ink shadow-[var(--shadow-e1)] hover:border-accent/30 hover:bg-paper-dim hover:shadow-[var(--shadow-e2)]",
  ghost: "text-accent hover:opacity-70",
  danger: "bg-error text-white shadow-[var(--shadow-e1)] hover:bg-error/90",
};

const sizes = {
  xl: "h-13 rounded-xl px-6 text-[16px] font-semibold",
  lg: "h-12 rounded-xl px-5 text-[15px] font-semibold",
  md: "h-10 rounded-[10px] px-4 text-[14px] font-semibold",
  s: "h-8 rounded-lg px-3 text-[13px] font-semibold",
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
