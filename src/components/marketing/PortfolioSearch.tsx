"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { PortfolioItem } from "@prisma/client";
import { PlaceholderArt } from "@/components/ui/PlaceholderArt";
import { DaisyAsterisk } from "@/components/marketing/DaisyAsterisk";
import { cn } from "@/lib/utils";

// 검색 결과 그리드는 스크롤로 처음 화면에 들어올 때 한 번만 재생되는 Reveal 대신,
// 매번 즉시 재생되는 애니메이션을 씁니다 — 검색으로 0개였다가 다시 채워지는 경우처럼
// 이미 화면 안에 있는 상태에서 목록이 새로 나타날 때도 항상 자연스럽게 보이도록 합니다.
const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, bounce: 0, duration: 0.4 } },
};

export function PortfolioSearch({ items }: { items: PortfolioItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.title, item.summary, item.category, item.industry ?? "", ...item.tags, ...item.features]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  return (
    <div>
      <div className="relative mt-16 max-w-sm">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="프로젝트, 기능으로 검색"
          className="w-full rounded-full bg-paper py-2.5 pr-4 pl-10 text-sm text-ink shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_24px_-16px_rgba(15,23,42,0.16)] placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <DaisyAsterisk variant="mono" className="mx-auto h-14 w-14 text-accent/70" />
          <p className="mt-4 text-sm text-muted">
            &ldquo;{query}&rdquo;에 해당하는 프로젝트를 찾지 못했습니다.
          </p>
        </div>
      ) : (
        <motion.div
          key={query}
          initial="hidden"
          animate="visible"
          variants={gridVariants}
          className={cn(
            "mt-10 grid gap-x-6 gap-y-14",
            filtered.length === 1
              ? "mx-auto max-w-sm"
              : filtered.length === 2
                ? "mx-auto max-w-3xl md:grid-cols-2"
                : "sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {filtered.map((item, i) => (
            <motion.div key={item.slug} variants={cardVariants}>
              <PortfolioCard item={item} index={i} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function PortfolioCard({ item, index }: { item: PortfolioItem; index: number }) {
  return (
    <Link href={`/portfolio/${item.slug}`} className="group block">
      {item.images[0] ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
          <Image
            src={item.images[0]}
            alt={item.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <PlaceholderArt index={index} className="aspect-[4/3]" />
      )}
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-accent">
        {item.category}
        {item.publishedAt ? ` · ${item.publishedAt.getFullYear()}` : ""}
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold transition-colors group-hover:text-accent">
        {item.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{item.summary}</p>
      {(item.duration || item.cost) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.duration && (
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
              기간 {item.duration}
            </span>
          )}
          {item.cost && (
            <span className="rounded-full bg-paper-dim px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
              비용 {item.cost}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
