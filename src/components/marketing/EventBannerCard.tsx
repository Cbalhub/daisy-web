import Image from "next/image";
import { Mark } from "@/components/brand/Mark";
import { OpenChatButton } from "@/components/chat/OpenChatButton";

type EventStyle = "dark" | "light" | "festive";

const STYLE_MAP: Record<
  EventStyle,
  { card: string; ring: string; glow: string; title: string; desc: string }
> = {
  dark: {
    card: "bg-ink text-paper",
    ring: "border-accent",
    glow: "bg-accent/20",
    title: "text-paper",
    desc: "text-paper/70",
  },
  light: {
    card: "bg-paper text-ink",
    ring: "border-accent",
    glow: "bg-accent/10",
    title: "text-ink",
    desc: "text-muted",
  },
  festive: {
    card: "bg-[linear-gradient(155deg,#f2b134_0%,#c9821f_100%)] text-paper",
    ring: "border-paper",
    glow: "bg-white/25",
    title: "text-paper",
    desc: "text-paper/80",
  },
};

/**
 * 이벤트 팝업의 실제 내용물입니다. 관리자 미리보기와 실제 방문자 팝업이
 * 똑같은 컴포넌트를 쓰도록 분리해서, "관리자 화면에서 본 것과 실제로 뜨는
 * 것이 다르다"는 일이 생기지 않게 합니다.
 *
 * imageUrl이 있으면 문구 대신 그 이미지를 그대로 보여줍니다 — 미리캔버스 등
 * 다른 도구로 직접 만든 배너를 그대로 올리고 싶을 때를 위한 탈출구입니다.
 */
export function EventBannerCard({
  style = "dark",
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
        <div className="relative aspect-square w-full">
          <Image src={imageUrl} alt={title || "이벤트"} fill className="object-cover" />
        </div>
        <div className="flex justify-center p-5 pt-4">
          <OpenChatButton>지금 문의하기</OpenChatButton>
        </div>
      </div>
    );
  }

  const tone = STYLE_MAP[style];

  return (
    <div className={`relative overflow-hidden rounded-2xl px-8 pt-11 pb-9 text-center shadow-[var(--shadow-e2)] ${tone.card}`}>
      {/* 큰 원형 배지가 시선을 가장 먼저 붙잡고, 그 위에 살짝 걸친 브랜드 심볼이
          "우리가 만든" 느낌을 더합니다. */}
      <div className={`relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 ${tone.ring}`}>
        <Mark
          variant="mono"
          className="absolute -top-4 -right-2 h-9 w-9 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
        />
        {badge && (
          <span className={`font-display text-3xl font-semibold tracking-tight ${tone.title}`}>
            {badge}
          </span>
        )}
      </div>

      {title && (
        <h2 className={`relative mt-6 font-display text-xl font-semibold tracking-tight text-balance ${tone.title}`}>
          {title}
        </h2>
      )}
      {description && (
        <p className={`relative mt-2.5 text-sm leading-relaxed text-balance ${tone.desc}`}>
          {description}
        </p>
      )}

      <div className="relative mt-7 flex justify-center">
        <OpenChatButton>지금 문의하기</OpenChatButton>
      </div>
    </div>
  );
}
