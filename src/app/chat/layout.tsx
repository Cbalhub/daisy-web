import Link from "next/link";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-paper">
      <header className="shrink-0 border-b border-line px-6 py-4">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          OverCook<span className="text-accent">.</span>
        </Link>
      </header>
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
