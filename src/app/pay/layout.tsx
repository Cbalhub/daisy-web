import type { Metadata } from "next";
import Link from "next/link";
import { DaisyAsterisk } from "@/components/marketing/DaisyAsterisk";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper-dim">
      <header className="border-b border-line px-6 py-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Daisy 홈">
          <DaisyAsterisk variant="color" className="h-5 w-5" />
          <span className="font-display text-lg font-semibold tracking-tight">Daisy</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">{children}</main>
    </div>
  );
}
