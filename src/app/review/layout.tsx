import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper-dim">
      <header className="border-b border-line px-6 py-4">
        <Wordmark className="text-[17px]" />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">{children}</main>
    </div>
  );
}
