import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-paper">
      <header className="shrink-0 border-b border-line px-6 py-4">
        <Wordmark className="text-[21px]" />
      </header>
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
