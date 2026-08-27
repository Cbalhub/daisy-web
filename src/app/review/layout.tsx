import Link from "next/link";

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper-dim">
      <header className="border-b border-line px-6 py-5">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          Daisy<span className="text-accent">.</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">{children}</main>
    </div>
  );
}
