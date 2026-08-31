import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ContractLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper-dim">
      <header className="border-b border-line px-6 py-4 print:hidden">
        <Wordmark className="text-[21px]" />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">{children}</main>
    </div>
  );
}
