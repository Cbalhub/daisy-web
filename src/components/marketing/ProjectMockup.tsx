import type { PortfolioItem } from "@prisma/client";
import { cn } from "@/lib/utils";

// 포트폴리오 이미지가 없을 때(실제 납품물은 대개 비공개), 프로젝트가 돌아가는
// 플랫폼의 화면을 코드로 흉내 냅니다. 여기서는 사이트 무채색 규칙의 예외로
// 텔레그램/디스코드의 실제 테마 색을 씁니다 — MOVD UI 가 아니라 "어떤 플랫폼에서
// 돌아가는 봇인지"를 한눈에 전달하는 스크린샷 대용이기 때문입니다.

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-xl border border-line bg-paper-dim p-5 sm:p-7",
        className
      )}
    >
      <div className="w-full max-w-[360px] overflow-hidden rounded-xl border border-line/60 shadow-[var(--shadow-e2)]">
        {children}
      </div>
    </div>
  );
}

/* ── 텔레그램 ─────────────────────────────────────────── */

const TG = { accent: "#3390ec", bg: "#ccd8e4", head: "#ffffff", inText: "#0f1620" };

function TelegramChat({
  name,
  rows,
}: {
  name: string;
  rows: { from: "in" | "out"; text: string }[];
}) {
  return (
    <div style={{ background: TG.bg }}>
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5"
        style={{ background: TG.head, borderBottom: "1px solid #e4e9ec" }}
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{ background: TG.accent }}
        >
          {name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold" style={{ color: TG.inText }}>
            {name}
          </p>
          <p className="text-[10.5px]" style={{ color: TG.accent }}>
            봇 · online
          </p>
        </div>
      </div>
      <div className="space-y-1.5 px-3 py-3">
        {rows.map((r, i) =>
          r.from === "in" ? (
            <p
              key={i}
              className="w-fit max-w-[86%] rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-[12px] leading-snug shadow-sm"
              style={{ color: TG.inText, whiteSpace: "pre-line" }}
            >
              {r.text}
            </p>
          ) : (
            <p
              key={i}
              className="ml-auto w-fit max-w-[86%] rounded-2xl rounded-br-sm px-3 py-1.5 text-[12px] leading-snug text-white"
              style={{ background: TG.accent, whiteSpace: "pre-line" }}
            >
              {r.text}
            </p>
          )
        )}
      </div>
    </div>
  );
}

/* ── 디스코드 ─────────────────────────────────────────── */

const DC = {
  bg: "#313338",
  head: "#2b2d31",
  blurple: "#5865f2",
  name: "#f2f3f5",
  text: "#dbdee1",
  muted: "#949ba4",
};

function DiscordChat({
  channel,
  msgs,
}: {
  channel: string;
  msgs: { author: string; bot?: boolean; text: string; embed?: { title: string; note: string } }[];
}) {
  return (
    <div style={{ background: DC.bg }}>
      <div
        className="flex items-center gap-1.5 px-3.5 py-2.5"
        style={{ background: DC.head, boxShadow: "0 1px 0 rgba(0,0,0,0.2)" }}
      >
        <span className="text-[14px] font-semibold" style={{ color: DC.muted }}>
          #
        </span>
        <span className="text-[12.5px] font-semibold" style={{ color: DC.name }}>
          {channel}
        </span>
      </div>
      <div className="space-y-3 px-3.5 py-3">
        {msgs.map((m, i) => (
          <div key={i} className="flex gap-2.5">
            <span
              className="mt-0.5 h-7 w-7 shrink-0 rounded-full"
              style={{ background: m.bot ? DC.blurple : "#5c6370" }}
            />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: DC.name }}>
                {m.author}
                {m.bot && (
                  <span
                    className="rounded px-1 py-px text-[8.5px] font-bold uppercase text-white"
                    style={{ background: DC.blurple }}
                  >
                    봇
                  </span>
                )}
                <span className="text-[10px] font-normal" style={{ color: DC.muted }}>
                  오후 3:12
                </span>
              </p>
              <p className="mt-0.5 text-[12px] leading-snug" style={{ color: DC.text }}>
                {m.text}
              </p>
              {m.embed && (
                <div
                  className="mt-1.5 rounded border-l-4 px-3 py-2"
                  style={{ background: "#2b2d31", borderColor: DC.blurple }}
                >
                  <p className="text-[11.5px] font-semibold" style={{ color: DC.name }}>
                    {m.embed.title}
                  </p>
                  <p className="mt-0.5 text-[10.5px]" style={{ color: DC.muted }}>
                    {m.embed.note}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 프로그램(데스크톱 앱) ─────────────────────────────── */

function ProgramWindow({ title, logs }: { title: string; logs: { t: string; msg: string }[] }) {
  return (
    <div className="bg-paper">
      <div className="flex items-center gap-1.5 border-b border-line bg-paper-dim px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-line" />
        <p className="ml-1.5 truncate text-[11px] font-medium text-ink-soft">{title}</p>
      </div>
      <div className="flex">
        <div className="hidden w-20 shrink-0 space-y-1.5 border-r border-line p-2.5 sm:block">
          {["작업", "스케줄", "로그"].map((s, i) => (
            <p
              key={s}
              className={cn(
                "rounded px-1.5 py-1 text-[10.5px]",
                i === 2 ? "bg-accent-soft font-semibold text-ink" : "text-muted"
              )}
            >
              {s}
            </p>
          ))}
        </div>
        <div className="flex-1 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-ink">실행 로그</p>
            <span className="rounded border border-line px-1.5 py-0.5 text-[9.5px] font-medium text-ink-soft">
              매일 09:00
            </span>
          </div>
          <ul className="space-y-1">
            {logs.map((l, i) => (
              <li key={i} className="flex gap-2 text-[10.5px] leading-relaxed">
                <span className="shrink-0 tabular-nums text-muted">{l.t}</span>
                <span className="text-ink">{l.msg}</span>
              </li>
            ))}
            <li className="flex gap-2 text-[10.5px] font-semibold text-ink">
              <span className="shrink-0 tabular-nums text-muted">09:01</span>
              <span>완료 · 다음 실행 대기</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── 프로젝트 → 장면 매핑 ─────────────────────────────── */

function scene(item: PortfolioItem): React.ReactNode {
  const s = item.slug;

  if (s === "telegram-usdt-wallet-bot")
    return (
      <TelegramChat
        name="USDT 지갑봇"
        rows={[
          { from: "in", text: "잔액" },
          { from: "out", text: "4,208.55 USDT\n오늘 입금 +620 · 출금 −75" },
          { from: "in", text: "입금 오면 알려줘" },
          { from: "out", text: "🔔 입금 감지 +120.00 USDT" },
        ]}
      />
    );

  if (s === "telegram-rpg-bot")
    return (
      <TelegramChat
        name="RPG봇"
        rows={[
          { from: "in", text: "/전투" },
          { from: "out", text: "⚔️ 필드보스 등장 — 참여 18명\n당신의 피해량 3,240 (2위)" },
          { from: "out", text: "🎁 드랍: 희귀 장비 +1 · EXP +450" },
        ]}
      />
    );

  if (s === "telegram-collection-bot")
    return (
      <TelegramChat
        name="수집봇"
        rows={[
          { from: "in", text: "/낚시" },
          { from: "out", text: "🎣 참돔 (희귀) 낚음! 도감 42/120" },
          { from: "in", text: "/랭킹" },
          { from: "out", text: "이번 주 1위 · 누적 무게 812kg" },
        ]}
      />
    );

  if (s === "telegram")
    return (
      <TelegramChat
        name="게임봇"
        rows={[
          { from: "in", text: "가위바위보" },
          { from: "out", text: "✌️ 냈어요 — 당신 승리! +10P" },
          { from: "in", text: "/포인트" },
          { from: "out", text: "보유 340P · 이번 주 5위" },
        ]}
      />
    );

  if (s === "discord-ai-bot")
    return (
      <DiscordChat
        channel="문의"
        msgs={[
          { author: "손님", text: "환불 언제 되나요?" },
          {
            author: "MOVD 봇",
            bot: true,
            text: "주문번호 알려주시면 바로 확인해 드릴게요. 카드 결제는 3~5영업일 걸립니다.",
          },
        ]}
      />
    );

  if (s === "discord-utility-bot")
    return (
      <DiscordChat
        channel="봇-명령어"
        msgs={[
          { author: "유저", text: "/전적 Hide on bush" },
          {
            author: "유틸봇",
            bot: true,
            text: "조회 완료",
            embed: { title: "Hide on bush — 솔로랭크", note: "Challenger 1,204LP · 14승 6패 (70%)" },
          },
        ]}
      />
    );

  if (s === "discord-vending-bot")
    return (
      <DiscordChat
        channel="자동-판매"
        msgs={[
          { author: "구매자", text: "닌텐도 기프트카드 1만원 구매합니다" },
          {
            author: "판매봇",
            bot: true,
            text: "입금 문자 확인됨 · 자동 지급 완료",
            embed: { title: "닌텐도 기프트카드 1만원", note: "9,400원 · 재고 11개 남음 · 24시간 무인" },
          },
        ]}
      />
    );

  // 자동화 프로그램 / 데이터 자동화 / 이메일 자동확인
  const logs =
    s === "n"
      ? [
          { t: "09:00", msg: "메일함 스캔 — 신규 12건" },
          { t: "09:00", msg: "AI 요약 3건 (중요)" },
          { t: "09:01", msg: "관리자 메일로 전송" },
        ]
      : [
          { t: "09:00", msg: "대상 사이트 크롤링 8곳" },
          { t: "09:00", msg: "데이터 정리 · 중복 제거" },
          { t: "09:01", msg: "리포트 생성 · 알림 발송" },
        ];
  return <ProgramWindow title={item.title} logs={logs} />;
}

export function ProjectMockup({
  item,
  className,
}: {
  item: PortfolioItem;
  className?: string;
}) {
  return <Frame className={className}>{scene(item)}</Frame>;
}
