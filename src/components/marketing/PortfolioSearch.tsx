"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { PortfolioItem } from "@prisma/client";
import { ProjectMockup } from "@/components/marketing/ProjectMockup";
import { Mark } from "@/components/brand/Mark";
import { cn } from "@/lib/utils";

// 검색 결과 그리드는 스크롤로 처음 화면에 들어올 때 한 번만 재생되는 Reveal 대신,
// 매번 즉시 재생되는 애니메이션을 씁니다 — 검색으로 0개였다가 다시 채워지는 경우처럼
// 이미 화면 안에 있는 상태에서 목록이 새로 나타날 때도 항상 자연스럽게 보이도록 합니다.
// key={query} 로 그리드를 리마운트해서 CSS 애니메이션(fadeup)을 매번 처음부터 재생,
// stagger 는 카드 index 기반 animation-delay 로. (framer-motion 제거 — 이 컴포넌트가
// /portfolio 에 있어서 그 페이지가 애니메이션 라이브러리를 통째로 받고 있었습니다.)

export function PortfolioSearch({ items }: { items: PortfolioItem[] }) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 게시된 모든 항목의 태그를 빈도순으로 모읍니다 — 자주 쓰인 태그가 먼저 보이게.
  const allTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const item of items) {
      for (const tag of item.tags) freq.set(tag, (freq.get(tag) ?? 0) + 1);
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }, [items]);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedTags.length > 0 && !selectedTags.every((t) => item.tags.includes(t))) {
        return false;
      }
      if (!q) return true;
      return [
        item.title,
        item.summary,
        item.category,
        item.industry ?? "",
        ...item.tags,
        ...item.features,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, query, selectedTags]);

  const filterKey = `${query}|${selectedTags.join(",")}`;

  return (
    <div>
      <div className="relative mt-12 max-w-sm">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
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
          className="w-full rounded-lg border border-line bg-paper py-2.5 pr-4 pl-9 text-sm text-ink placeholder:text-muted transition-colors focus:border-ink focus:outline-none"
        />
      </div>

      {allTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink-soft hover:border-ink/30 hover:text-ink"
                )}
              >
                {tag}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="rounded-full px-3 py-1 text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              필터 초기화
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <Mark variant="mono" className="mx-auto h-12 w-12 text-accent/60" />
          <p className="mt-4 text-sm text-muted">
            {query
              ? `“${query}”에 해당하는 프로젝트를 찾지 못했습니다.`
              : "선택한 태그에 해당하는 프로젝트가 없습니다."}
          </p>
        </div>
      ) : (
        <div
          key={filterKey}
          className={cn(
            "mt-10 grid gap-5",
            filtered.length === 1
              ? "mx-auto max-w-sm"
              : filtered.length === 2
                ? "mx-auto max-w-3xl md:grid-cols-2"
                : "sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {filtered.map((item, idx) => (
            <div
              key={item.slug}
              className="motion-safe:animate-[fadeup_0.35s_cubic-bezier(0.22,1,0.36,1)_both]"
              style={{ animationDelay: `${Math.min(idx * 45, 270)}ms` }}
            >
              <PortfolioCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioCard({ item }: { item: PortfolioItem }) {
  return (
    <Link
      href={`/portfolio/${item.slug}`}
      className="group block transition-transform duration-300 ease-out hover:-translate-y-1"
    >
      {item.images[0] ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line shadow-[var(--shadow-e1)] transition-shadow duration-300 group-hover:shadow-[var(--shadow-e2)]">
          <Image
            src={item.images[0]}
            alt={item.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <ProjectMockup
          item={item}
          className="aspect-[16/10] shadow-[var(--shadow-e1)] transition-shadow duration-300 group-hover:shadow-[var(--shadow-e2)]"
        />
      )}
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-base font-semibold transition-colors group-hover:text-accent">
          {item.title}
        </h2>
        <span className="shrink-0 text-xs text-muted">{item.category}</span>
      </div>
      <p className="mt-1 line-clamp-1 text-sm text-muted">{item.summary}</p>
      {(item.duration || item.cost) && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-sm">
          {item.duration && (
            <span>
              <span className="text-muted">기간</span>{" "}
              <span className="font-semibold text-ink">{item.duration}</span>
            </span>
          )}
          {item.cost && (
            <span>
              <span className="text-muted">비용</span>{" "}
              <span className="font-semibold text-ink">{item.cost}</span>
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
