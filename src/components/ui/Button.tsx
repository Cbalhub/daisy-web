import Link from "next/link";
import { cn } from "@/lib/utils";

type Common = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[transform,background-color,color,box-shadow,border-color] duration-300 ease-out active:scale-[0.97] active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-accent text-white hover:opacity-90",
  secondary: "border border-line bg-transparent text-ink hover:border-ink",
  ghost: "text-accent hover:opacity-70",
};

const sizes = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
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
