import Image from "next/image";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { cn } from "@/lib/utils";

type EventStyle = "dark" | "light" | "festive";

// 사이트가 무채색이라 이벤트 팝업도 무채색으로 — light(기본, 흰 카드) / dark(검정 카드).
// 예전 festive(주황 그라데이션)는 dark 로 접습니다.
const STYLE_MAP: Record<
  EventStyle,
  { card: string; title: string; desc: string; pill: string; btn: string }
> = {
  light: {
    card: "bg-paper border-line",
    title: "text-ink",
    desc: "text-muted",
    pill: "bg-paper-dim text-ink-soft",
    btn: "",
  },
  festive: {
    card: "bg-paper border-line",
    title: "text-ink",
    desc: "text-muted",
    pill: "bg-paper-dim text-ink-soft",
    btn: "",
  },
  dark: {
    card: "bg-ink border-ink",
    title: "text-paper",
    desc: "text-paper/65",
    pill: "bg-paper/15 text-paper",
    btn: "!bg-paper !text-ink hover:!bg-paper/90",
  },
};

/**
 * 이벤트 팝업의 실제 내용물. 관리자 미리보기와 방문자 팝업이 같은 컴포넌트를 씁니다.
 * imageUrl 이 있으면 문구 대신 그 배너를 그대로 보여줍니다(미리캔버스 등으로 만든 배너용).
 */
export function EventBannerCard({
  style = "light",
  badge,
  title,
  description,
  imageUrl,
}: {
  style?: EventStyle;
  badge: string;
  title: string;
  description: string;
  imageUrl?: string;
}) {
  if (imageUrl) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-e2)]">
        <div className="relative aspect-[4/3] w-full bg-paper-dim">
          <Image src={imageUrl} alt={title || "이벤트"} fill className="object-contain" />
        </div>
        <div className="p-5">
          <OpenChatButton size="md" className="w-full">
            지금 문의하기
          </OpenChatButton>
        </div>
      </div>
    );
  }

  const tone = STYLE_MAP[style] ?? STYLE_MAP.light;

  return (
    <div className={cn("overflow-hidden rounded-2xl border p-7 shadow-[var(--shadow-e2)]", tone.card)}>
      {badge && (
        <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-semibold", tone.pill)}>
          {badge}
        </span>
      )}
      {title && (
        <h2
          className={cn(
            "font-display text-[1.35rem] leading-tight font-extrabold tracking-tight text-balance",
            badge ? "mt-3.5" : "",
            tone.title
          )}
        >
          {title}
        </h2>
      )}
      {description && (
        <p className={cn("mt-2.5 text-sm leading-relaxed", tone.desc)}>{description}</p>
      )}
      <div className="mt-6">
        <OpenChatButton size="md" className={cn("w-full", tone.btn)}>
          지금 문의하기
        </OpenChatButton>
      </div>
    </div>
  );
}
