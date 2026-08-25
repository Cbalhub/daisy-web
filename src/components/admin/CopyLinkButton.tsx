"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";

export function CopyLinkButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const ok = await copyToClipboard(text);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={copy}
      className="rounded-lg border border-admin-border bg-admin-surface px-3 py-1.5 text-xs font-medium text-admin-text transition-colors hover:border-admin-blue"
    >
      {copied ? "복사됨" : "링크 복사"}
    </button>
  );
}
