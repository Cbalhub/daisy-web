import type { PortfolioItem } from "@prisma/client";
import { cn } from "@/lib/utils";
import { MockupCarousel } from "@/components/marketing/MockupCarousel";

// 포트폴리오 이미지가 없을 때(실제 납품물은 대개 비공개), 프로젝트가 돌아가는
// 플랫폼의 화면을 코드로 흉내 냅니다. 여기서는 사이트 무채색 규칙의 예외로
// 텔레그램/디스코드의 실제 테마 색을 씁니다 — MOVD UI 가 아니라 "어떤 플랫폼에서
// 돌아가는 봇인지"를 한눈에 전달하는 스크린샷 대용이기 때문입니다.

/* ── 텔레그램 ─────────────────────────────────────────── */

const TG = { accent: "#3390ec", bg: "#ccd8e4", head: "#ffffff", inText: "#0f1620" };

function TelegramShell({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col" style={{ background: TG.bg }}>
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
      <div className="flex-1 space-y-2 overflow-hidden px-3 py-3.5 [min-height:236px]">{children}</div>
    </div>
  );
}

function TgIn({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="w-fit max-w-[86%] rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-[12px] leading-snug shadow-sm"
      style={{ color: TG.inText, whiteSpace: "pre-line" }}
    >
      {children}
    </p>
  );
}
function TgOut({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="ml-auto w-fit max-w-[86%] rounded-2xl rounded-br-sm px-3 py-1.5 text-[12px] leading-snug text-white"
      style={{ background: TG.accent, whiteSpace: "pre-line" }}
    >
      {children}
    </p>
  );
}

function TelegramChat({ name, rows }: { name: string; rows: { from: "in" | "out"; text: string }[] }) {
  return (
    <TelegramShell name={name}>
      {rows.map((r, i) => (r.from === "in" ? <TgIn key={i}>{r.text}</TgIn> : <TgOut key={i}>{r.text}</TgOut>))}
    </TelegramShell>
  );
}

function TelegramMenu({ name, buttons }: { name: string; buttons: string[] }) {
  return (
    <TelegramShell name={name}>
      <TgIn>메뉴에서 골라주세요 👇</TgIn>
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {buttons.map((b) => (
          <span
            key={b}
            className="rounded-lg bg-white/90 px-2 py-2 text-center text-[11px] font-medium shadow-sm"
            style={{ color: TG.inText }}
          >
            {b}
          </span>
        ))}
      </div>
    </TelegramShell>
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

function DiscordShell({ channel, children }: { channel: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col" style={{ background: DC.bg }}>
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
      <div className="flex-1 space-y-3.5 overflow-hidden px-3.5 py-3.5 [min-height:244px]">{children}</div>
    </div>
  );
}

function DcMsg({
  author,
  bot,
  text,
  embed,
}: {
  author: string;
  bot?: boolean;
  text: string;
  embed?: { title: string; note: string };
}) {
  return (
    <div className="flex gap-2.5">
      <span
        className="mt-0.5 h-7 w-7 shrink-0 rounded-full"
        style={{ background: bot ? DC.blurple : "#5c6370" }}
      />
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: DC.name }}>
          {author}
          {bot && (
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
          {text}
        </p>
        {embed && (
          <div
            className="mt-1.5 rounded border-l-4 px-3 py-2"
            style={{ background: "#2b2d31", borderColor: DC.blurple }}
          >
            <p className="text-[11.5px] font-semibold" style={{ color: DC.name }}>
              {embed.title}
            </p>
            <p className="mt-0.5 text-[10.5px]" style={{ color: DC.muted }}>
              {embed.note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DiscordChat({
  channel,
  msgs,
}: {
  channel: string;
  msgs: { author: string; bot?: boolean; text: string; embed?: { title: string; note: string } }[];
}) {
  return (
    <DiscordShell channel={channel}>
      {msgs.map((m, i) => (
        <DcMsg key={i} {...m} />
      ))}
    </DiscordShell>
  );
}

function DiscordSlash({ channel, commands }: { channel: string; commands: { cmd: string; desc: string }[] }) {
  return (
    <DiscordShell channel={channel}>
      <div className="rounded-lg px-2.5 py-2 text-[12px]" style={{ background: "#383a40", color: DC.text }}>
        <span style={{ color: DC.blurple }}>/</span>봇
      </div>
      <div className="overflow-hidden rounded-lg" style={{ background: "#2b2d31" }}>
        <p className="px-3 py-1.5 text-[9.5px] font-bold uppercase" style={{ color: DC.muted }}>
          명령어
        </p>
        {commands.map((c, i) => (
          <div
            key={c.cmd}
            className="flex items-center gap-2 px-3 py-2"
            style={{ background: i === 0 ? "#35373c" : "transparent" }}
          >
            <span className="text-[11.5px] font-semibold" style={{ color: DC.name }}>
              /{c.cmd}
            </span>
            <span className="truncate text-[10.5px]" style={{ color: DC.muted }}>
              {c.desc}
            </span>
          </div>
        ))}
      </div>
    </DiscordShell>
  );
}

/* ── 프로그램(데스크톱 앱) ─────────────────────────────── */

function ProgramShell({
  title,
  tab,
  children,
}: {
  title: string;
  tab: "로그" | "스케줄" | "데이터";
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-paper">
      <div className="flex items-center gap-1.5 border-b border-line bg-paper-dim px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-line" />
        <p className="ml-1.5 truncate text-[11px] font-medium text-ink-soft">{title}</p>
      </div>
      <div className="flex flex-1 overflow-hidden [min-height:244px]">
        <div className="hidden w-[72px] shrink-0 space-y-1 border-r border-line p-2 sm:block">
          {(["작업", "스케줄", "로그", "데이터"] as const).map((s) => (
            <p
              key={s}
              className={cn(
                "rounded px-1.5 py-1 text-[10.5px]",
                s === tab ? "bg-accent-soft font-semibold text-ink" : "text-muted"
              )}
            >
              {s}
            </p>
          ))}
        </div>
        <div className="flex-1 overflow-hidden p-3">{children}</div>
      </div>
    </div>
  );
}

function ProgramLog({ title, logs }: { title: string; logs: { t: string; msg: string }[] }) {
  return (
    <ProgramShell title={title} tab="로그">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-ink">실행 로그</p>
        <span className="rounded border border-line px-1.5 py-0.5 text-[9.5px] font-medium text-ink-soft">
          매일 09:00
        </span>
      </div>
      <ul className="space-y-1.5">
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
    </ProgramShell>
  );
}

function ProgramConfig({ title, rows }: { title: string; rows: { k: string; v: string }[] }) {
  return (
    <ProgramShell title={title} tab="스케줄">
      <p className="mb-2 text-[11px] font-semibold text-ink">스케줄 · 대상</p>
      <dl className="space-y-2">
        {rows.map((r) => (
          <div key={r.k} className="flex justify-between gap-3 text-[11px]">
            <dt className="text-muted">{r.k}</dt>
            <dd className="text-right font-medium text-ink">{r.v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 border-t border-line pt-2.5">
        <span className="rounded bg-accent px-2 py-1 text-[10px] font-semibold text-on-accent">
          지금 실행
        </span>
      </div>
    </ProgramShell>
  );
}

function ProgramTable({ title, cols, rows }: { title: string; cols: string[]; rows: string[][] }) {
  return (
    <ProgramShell title={title} tab="데이터">
      <p className="mb-2 text-[11px] font-semibold text-ink">수집 결과</p>
      <div className="overflow-hidden rounded border border-line text-[10px]">
        <div className="flex bg-paper-dim font-medium text-ink-soft">
          {cols.map((c) => (
            <span key={c} className="flex-1 px-2 py-1.5">
              {c}
            </span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} className="flex border-t border-line text-ink">
            {r.map((cell, j) => (
              <span key={j} className="flex-1 px-2 py-1.5 tabular-nums">
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted">CSV · 대시보드로 자동 전송</p>
    </ProgramShell>
  );
}

/* ── 프로젝트 → 4장면 ─────────────────────────────────── */

type Platform = "telegram" | "discord" | "program";

function platformOf(item: PortfolioItem): Platform {
  const s = item.slug;
  if (s.startsWith("discord") || item.category.includes("디스코드")) return "discord";
  if (s.startsWith("telegram") || item.category.includes("텔레그램") || item.category.includes("챗봇"))
    return "telegram";
  return "program";
}

type Row = { from: "in" | "out"; text: string };

const TELEGRAM: Record<string, { name: string; buttons: string[]; a: Row[]; b: Row[]; c: Row[] }> = {
  "telegram-usdt-wallet-bot": {
    name: "USDT 지갑봇",
    buttons: ["💰 잔액", "📥 입금내역", "📊 시세", "⚙️ 알림설정"],
    a: [
      { from: "in", text: "잔액" },
      { from: "out", text: "💰 4,208.55 USDT\n오늘 입금 +620.00 · 출금 −75.40" },
      { from: "in", text: "최근 입금 3건 보여줘" },
      { from: "out", text: "09:41  +120.00  Tx a3f9…\n02:15  +500.00  Tx 7c2b…\n어제  +75.00  Tx e10d…" },
    ],
    b: [
      { from: "in", text: "입금 오면 바로 알려줘" },
      { from: "out", text: "🔔 알림 켬 — TRC20 지갑 감시 중" },
      { from: "out", text: "🔔 입금 감지\n+120.00 USDT · 홍길동 지갑" },
      { from: "out", text: "⚠️ 가짜 USDT 컨트랙트 1건 차단됨" },
    ],
    c: [
      { from: "in", text: "/시세" },
      { from: "out", text: "USDT/KRW  1,384원\nBTC  96,240,000원  ▲ 1.2%\nETH  5,180,000원  ▼ 0.4%" },
      { from: "in", text: "10만원어치면 몇 개야?" },
      { from: "out", text: "약 72.25 USDT (수수료 제외)" },
    ],
  },
  "telegram-rpg-bot": {
    name: "RPG봇",
    buttons: ["⚔️ 전투", "🛒 상점", "🏆 랭킹", "🎒 인벤토리"],
    a: [
      { from: "in", text: "/전투" },
      { from: "out", text: "⚔️ 필드보스 '이그니스' 등장 — 참여 18명" },
      { from: "out", text: "당신의 피해량 3,240 (2위)\n🎁 드랍: 희귀 장비 +1 · EXP +450" },
      { from: "in", text: "장비 착용" },
      { from: "out", text: "✅ '용의 롱소드' 장착 — 공격력 +38" },
    ],
    b: [
      { from: "in", text: "/강화 롱소드" },
      { from: "out", text: "현재 +6 → 다음 +7 (성공률 42%)\n필요: 강화석 3개 · 골드 1,200" },
      { from: "in", text: "ㄱㄱ" },
      { from: "out", text: "✨ 강화 성공! +7 롱소드\n공격력 +38 → +47" },
    ],
    c: [
      { from: "in", text: "/랭킹" },
      { from: "out", text: "🏆 이번 주 랭킹\n1. 홍길동  Lv.51\n2. 김철수  Lv.48\n3. 나  Lv.24  (▲ 2)" },
    ],
  },
  "telegram-collection-bot": {
    name: "수집봇",
    buttons: ["🎣 낚시", "📖 도감", "🏪 상점", "🥇 랭킹"],
    a: [
      { from: "in", text: "/낚시" },
      { from: "out", text: "🎣 던졌습니다… 입질이 옵니다!" },
      { from: "out", text: "참돔 (희귀) 낚음!\n무게 3.4kg · 도감 42/120 · +80P" },
      { from: "in", text: "한 번 더" },
      { from: "out", text: "붕어 (일반) · 0.6kg — 방생했습니다" },
    ],
    b: [
      { from: "in", text: "/도감 참돔" },
      { from: "out", text: "참돔  ★★★★☆\n최대 기록 5.1kg · 3회 포획\n서식지: 남해 · 미끼: 새우" },
      { from: "in", text: "도감 몇 %?" },
      { from: "out", text: "전체 완성도 35% (42/120)" },
    ],
    c: [
      { from: "in", text: "/랭킹" },
      { from: "out", text: "🥇 이번 주 낚시왕\n1. 나  누적 812kg\n2. 이영희  누적 690kg\n3. 박민수  누적 604kg" },
    ],
  },
  telegram: {
    name: "게임봇",
    buttons: ["🎮 게임", "💎 포인트", "🏆 랭킹", "❓ 도움말"],
    a: [
      { from: "in", text: "가위바위보 바위" },
      { from: "out", text: "✌️ 저는 가위! 당신 승리 — +10P" },
      { from: "in", text: "한판 더, 보" },
      { from: "out", text: "✊ 저는 바위! 아쉽네요 — +2P (참가상)" },
    ],
    b: [
      { from: "in", text: "/퀴즈" },
      { from: "out", text: "Q. 대한민국의 수도는?\n① 서울  ② 부산  ③ 인천" },
      { from: "in", text: "1" },
      { from: "out", text: "⭕ 정답! +15P · 연속 정답 3회 🔥" },
    ],
    c: [
      { from: "in", text: "/포인트" },
      { from: "out", text: "💎 보유 340P · 이번 주 5위\n연속 출석 7일 · 다음 보상까지 60P" },
      { from: "in", text: "출석" },
      { from: "out", text: "📅 오늘 출석 완료 — +20P" },
    ],
  },
};

const DISCORD: Record<
  string,
  {
    channel: string;
    cmds: { cmd: string; desc: string }[];
    a: React.ComponentProps<typeof DcMsg>[];
    b: React.ComponentProps<typeof DcMsg>[];
    c: React.ComponentProps<typeof DcMsg>[];
  }
> = {
  "discord-ai-bot": {
    channel: "문의",
    cmds: [
      { cmd: "질문", desc: "AI에게 물어보기" },
      { cmd: "요약", desc: "대화 요약" },
      { cmd: "문의", desc: "상담원 연결" },
    ],
    a: [
      { author: "손님", text: "환불 언제 되나요?" },
      { author: "MOVD 봇", bot: true, text: "주문번호 알려주시면 바로 확인해 드릴게요. 카드 결제는 3~5영업일 걸립니다." },
      { author: "손님", text: "주문번호 #2841 이에요" },
      { author: "MOVD 봇", bot: true, text: "확인했습니다. 어제 오후 환불 접수됐고 3/12까지 카드사 반영 예정이에요." },
    ],
    b: [
      { author: "유저", text: "봇 만드는 데 얼마나 걸려요?" },
      { author: "MOVD 봇", bot: true, text: "간단한 건 3일, 게임 봇은 1~2주 정도예요. 원하시는 기능 알려주시면 견적 드릴게요." },
      { author: "유저", text: "포인트 상점이랑 미니게임 3개요" },
      { author: "MOVD 봇", bot: true, text: "그 정도면 약 1주, 30만원대예요. 담당자 연결해 드릴까요?" },
    ],
    c: [
      { author: "유저", text: "/요약 오늘" },
      {
        author: "MOVD 봇",
        bot: true,
        text: "오늘 대화 42개 요약",
        embed: { title: "핵심 3줄", note: "가격 문의 5건 · 버그 제보 2건 · 기능 제안 1건" },
      },
      { author: "MOVD 봇", bot: true, text: "버그 제보 2건은 #개발-이슈 로 자동 등록했어요." },
    ],
  },
  "discord-utility-bot": {
    channel: "봇-명령어",
    cmds: [
      { cmd: "전적", desc: "롤 전적·티어 조회" },
      { cmd: "재생", desc: "음악 재생" },
      { cmd: "대기열", desc: "재생 목록 보기" },
    ],
    a: [
      { author: "유저", text: "/전적 Hide on bush" },
      {
        author: "유틸봇",
        bot: true,
        text: "조회 완료",
        embed: { title: "Hide on bush — 솔로랭크", note: "Challenger 1,204LP · 14승 6패 (70%) · 최근 KDA 4.2" },
      },
      { author: "유저", text: "최근 판 보여줘" },
      { author: "유틸봇", bot: true, text: "승 · 아트록스 8/2/6\n승 · 아트록스 11/4/3\n패 · 케일 2/7/9" },
    ],
    b: [
      { author: "유저", text: "/재생 lofi hip hop" },
      {
        author: "유틸봇",
        bot: true,
        text: "▶️ 재생 시작",
        embed: { title: "lofi hip hop radio", note: "대기열 3곡 · 요청자 @유저 · 볼륨 40%" },
      },
      { author: "다른유저", text: "/대기열 추가 study beats" },
      { author: "유틸봇", bot: true, text: "➕ 대기열 4번으로 추가됨" },
    ],
    c: [
      { author: "관리자", text: "/청소 50" },
      { author: "유틸봇", bot: true, text: "🧹 메시지 50개 삭제 완료" },
      { author: "관리자", text: "/역할 @신규 멤버" },
      { author: "유틸봇", bot: true, text: "✅ '멤버' 역할 지급 — 인증 채널 접근 열림" },
    ],
  },
  "discord-vending-bot": {
    channel: "자동-판매",
    cmds: [
      { cmd: "구매", desc: "상품을 구매합니다" },
      { cmd: "재고", desc: "남은 재고 확인" },
      { cmd: "환불", desc: "환불 요청" },
    ],
    a: [
      { author: "구매자", text: "닌텐도 기프트카드 1만원 구매합니다" },
      { author: "판매봇", bot: true, text: "9,400원을 아래 계좌로 입금해 주세요. 입금자명에 디스코드 닉네임 부탁드려요." },
      {
        author: "판매봇",
        bot: true,
        text: "✅ 입금 문자 확인됨 · 자동 지급 완료",
        embed: { title: "닌텐도 기프트카드 1만원", note: "코드 DM 발송 완료 · 재고 11개 · 24시간 무인" },
      },
    ],
    b: [
      { author: "구매자", text: "/재고" },
      {
        author: "판매봇",
        bot: true,
        text: "현재 판매 재고",
        embed: { title: "판매 중 3종", note: "기프트카드 11 · 서버부스트 5 · 커스텀롤 ∞" },
      },
      { author: "구매자", text: "품절되면 알림 와요?" },
      { author: "판매봇", bot: true, text: "네, 재입고 시 이 채널에 자동 공지됩니다." },
    ],
    c: [
      { author: "판매봇", bot: true, text: "🔔 신한은행 입금 9,400원 (홍길*) 감지" },
      { author: "판매봇", bot: true, text: "→ 주문 #2841 매칭 · 코드 자동 발송 · 장부 기록 완료" },
      { author: "판매봇", bot: true, text: "⚠️ 금액 불일치 입금 1건 — 관리자 확인 대기" },
    ],
  },
};

function scenesFor(item: PortfolioItem): React.ReactNode[] {
  const p = platformOf(item);

  if (p === "telegram") {
    const d = TELEGRAM[item.slug] ?? TELEGRAM.telegram;
    return [
      <TelegramChat key="a" name={d.name} rows={d.a} />,
      <TelegramMenu key="m" name={d.name} buttons={d.buttons} />,
      <TelegramChat key="b" name={d.name} rows={d.b} />,
      <TelegramChat key="c" name={d.name} rows={d.c} />,
    ];
  }

  if (p === "discord") {
    const d = DISCORD[item.slug] ?? DISCORD["discord-ai-bot"];
    return [
      <DiscordChat key="a" channel={d.channel} msgs={d.a} />,
      <DiscordSlash key="s" channel={d.channel} commands={d.cmds} />,
      <DiscordChat key="b" channel={d.channel} msgs={d.b} />,
      <DiscordChat key="c" channel={d.channel} msgs={d.c} />,
    ];
  }

  const isMail = item.slug === "n";
  return [
    <ProgramLog
      key="log"
      title={item.title}
      logs={
        isMail
          ? [
              { t: "09:00:00", msg: "메일함 3개 계정 로그인" },
              { t: "09:00:04", msg: "신규 메일 12건 수집" },
              { t: "09:00:11", msg: "스팸·광고 5건 제외" },
              { t: "09:00:23", msg: "AI 요약 — 중요 3건 추림" },
              { t: "09:00:31", msg: "첨부파일 2건 드라이브 저장" },
              { t: "09:00:38", msg: "관리자 메일로 요약본 전송" },
            ]
          : [
              { t: "09:00:00", msg: "대상 사이트 8곳 접속" },
              { t: "09:00:12", msg: "상품·가격·재고 필드 추출" },
              { t: "09:00:29", msg: "중복 제거 · 형식 정규화" },
              { t: "09:00:35", msg: "전일 대비 변동 계산" },
              { t: "09:00:41", msg: "CSV 저장 · 대시보드 갱신" },
              { t: "09:00:46", msg: "슬랙 · 이메일 리포트 발송" },
            ]
      }
    />,
    <ProgramConfig
      key="cfg"
      title={item.title}
      rows={
        isMail
          ? [
              { k: "확인 주기", v: "매일 09:00" },
              { k: "대상 메일함", v: "Gmail 3개" },
              { k: "분류 규칙", v: "12개" },
              { k: "요약 방식", v: "AI · 중요도순" },
              { k: "첨부 처리", v: "드라이브 자동 저장" },
              { k: "결과 전송", v: "관리자 메일 · 슬랙" },
              { k: "실패 시", v: "3회 재시도 후 알림" },
            ]
          : [
              { k: "크롤링 주기", v: "매일 09:00" },
              { k: "대상 사이트", v: "8곳" },
              { k: "수집 필드", v: "상품·가격·재고·리뷰" },
              { k: "출력 형식", v: "CSV · 구글 시트" },
              { k: "변동 알림", v: "±5% 이상만" },
              { k: "채널", v: "슬랙 #모니터링" },
              { k: "보관", v: "90일치 이력" },
            ]
      }
    />,
    <ProgramTable
      key="tbl"
      title={item.title}
      cols={isMail ? ["시각", "발신", "분류"] : ["항목", "값", "변화"]}
      rows={
        isMail
          ? [
              ["08:41", "세무대리인", "중요"],
              ["08:52", "쿠팡", "광고"],
              ["09:02", "뉴스레터", "보관"],
              ["09:07", "AWS 청구서", "중요"],
              ["09:15", "고객 문의", "중요"],
              ["09:18", "채용 스팸", "제외"],
            ]
          : [
              ["A상품", "24,900", "▲ 3%"],
              ["B상품", "18,000", "▼ 1%"],
              ["C상품", "품절", "—"],
              ["D상품", "9,900", "▲ 12%"],
              ["E상품", "31,500", "▲ 0%"],
              ["F상품", "재입고", "NEW"],
            ]
      }
    />,
    <ProgramLog
      key="log2"
      title={item.title}
      logs={[
        { t: "오늘", msg: "성공 · 12건 처리 · 0.9초" },
        { t: "어제", msg: "성공 · 실패 0" },
        { t: "이번 주", msg: "누적 처리 210건" },
        { t: "이번 달", msg: "가동률 100% · 장애 0" },
        { t: "평균", msg: "실행 0.8초" },
        { t: "다음 실행", msg: "내일 09:00" },
      ]}
    />,
  ];
}

/* ── 내보내기 ─────────────────────────────────────────── */

// 카드용 — 첫 화면 하나를 프레임에 꽉 채워 보여줍니다(가로형 크롭).
export function ProjectMockup({ item, className }: { item: PortfolioItem; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-paper-dim p-4",
        className
      )}
    >
      <div className="h-full w-full overflow-hidden rounded-lg border border-line/60 shadow-[var(--shadow-e1)]">
        {scenesFor(item)[0]}
      </div>
    </div>
  );
}

// 상세 페이지 상단 — 4장면을 화살표로 넘겨 보는 캐러셀.
export function ProjectMockupGallery({ item }: { item: PortfolioItem }) {
  return <MockupCarousel panels={scenesFor(item)} />;
}
