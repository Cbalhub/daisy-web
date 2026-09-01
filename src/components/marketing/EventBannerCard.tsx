import Image from "next/image";
import { Mark } from "@/components/brand/Mark";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { cn } from "@/lib/utils";

type EventStyle = "dark" | "light" | "festive";

// 사이트가 무채색이라 이벤트 팝업도 무채색 + 로고 버건디 한 점.
// light(흰 카드) / dark(검정 카드). 예전 festive(주황 그라데이션)는 light 로 접습니다.
type Tone = { card: string; chip: string; title: string; desc: string; rule: string; mark: "brand" | "mono"; btn: string };

const LIGHT: Tone = {
  card: "bg-paper border-line",
  chip: "border-mark/35 text-mark",
  title: "text-ink",
  desc: "text-muted",
  rule: "bg-mark",
  mark: "brand",
  btn: "",
};

const TONE: Record<EventStyle, Tone> = {
  light: LIGHT,
  festive: LIGHT,
  dark: {
    card: "bg-ink border-ink",
    chip: "border-paper/25 text-paper/90",
    title: "text-paper",
    desc: "text-paper/65",
    rule: "bg-paper/40",
    mark: "mono",
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
          <Image
            src={imageUrl}
            alt={title || "이벤트"}
            fill
            sizes="(max-width: 640px) 90vw, 384px"
            className="object-contain"
          />
        </div>
        <div className="p-5">
          <OpenChatButton size="md" className="w-full">
            지금 문의하기
          </OpenChatButton>
        </div>
      </div>
    );
  }

  const t = TONE[style] ?? TONE.light;

  return (
    <div className={cn("overflow-hidden rounded-2xl border p-8 shadow-[var(--shadow-e2)]", t.card)}>
      <div className="flex items-center gap-2.5">
        <Mark variant={t.mark} rough={false} className={cn("h-5 w-5", t.mark === "mono" && "text-paper")} />
        {badge && (
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide",
              t.chip
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {title && (
        <h2
          className={cn(
            "mt-5 font-display text-[1.65rem] leading-[1.18] font-extrabold tracking-tight text-balance",
            t.title
          )}
        >
          {title}
        </h2>
      )}

      {description && (
        <>
          <span className={cn("mt-4 block h-0.5 w-8 rounded-full", t.rule)} />
          <p className={cn("mt-3.5 text-[13.5px] leading-relaxed", t.desc)}>{description}</p>
        </>
      )}

      <OpenChatButton size="md" className={cn("mt-7 w-full", t.btn)}>
        지금 문의하기
      </OpenChatButton>
    </div>
  );
}
