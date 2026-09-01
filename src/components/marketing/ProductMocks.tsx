// 마케팅 페이지에서 재사용하는 작은 제품 목업들. 무채색(색은 로고에만).
// 가짜 브라우저 창틀은 쓰지 않고, 글자는 읽히도록 12px 이상 + 진한 색으로.

function PanelHead({ title, right }: { title: string; right?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-line px-4 py-3">
      <span className="h-2 w-2 rounded-full bg-accent" />
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      {right && <span className="ml-auto text-[12px] font-medium text-ink-soft">{right}</span>}
    </div>
  );
}

export function ChatMiniCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-e2)]">
      <PanelHead title="실시간 상담" right="응답 가능" />
      <div className="flex-1 space-y-2.5 overflow-hidden p-4">
        <div className="ml-auto w-fit max-w-[82%] rounded-2xl rounded-br-md bg-paper-dim px-3.5 py-2 text-[13px] text-ink">
          안녕하세요, 디스코드 봇 문의드려요
        </div>
        <div className="w-fit max-w-[82%] rounded-2xl rounded-bl-md bg-accent px-3.5 py-2 text-[13px] text-on-accent">
          네 안녕하세요! 어떤 기능이 필요하세요?
        </div>
        <div className="ml-auto w-fit max-w-[82%] rounded-2xl rounded-br-md bg-paper-dim px-3.5 py-2 text-[13px] text-ink">
          포인트 시스템이랑 미니게임이요. 챗봇도 같이 붙일 수 있나요?
        </div>
        <div className="w-fit max-w-[82%] rounded-2xl rounded-bl-md bg-accent px-3.5 py-2 text-[13px] text-on-accent">
          둘 다 가능해요. 바로 견적 도와드릴게요
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3">
        <span className="flex-1 rounded-full bg-paper-dim px-3.5 py-2 text-[12px] text-muted">
          메시지 입력…
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <path d="M8 13V3M4 7l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}

const RUN = [
  { step: "주문 12건 수집", t: "0.2s" },
  { step: "중복 제거 · 검증", t: "0.1s" },
  { step: "구글 시트 동기화", t: "0.4s" },
  { step: "정산 리포트 생성", t: "0.1s" },
  { step: "카톡 알림 3건 발송", t: "0.1s" },
];

export function AutomationCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-e2)]">
      <PanelHead title="자동화 배치" right="매일 09:00" />
      <ul className="flex-1 space-y-3 p-4">
        {RUN.map((r) => (
          <li key={r.step} className="flex items-center gap-2.5 text-[13px]">
            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden>
              <path
                d="M3 7.2l2.6 2.6 5.4-5.8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="flex-1 text-ink">{r.step}</span>
            <span className="tabular-nums text-ink-soft">{r.t}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-4 py-3">
        <span className="block h-1.5 overflow-hidden rounded-full bg-paper-dim">
          <span className="block h-full w-full rounded-full bg-accent" />
        </span>
        <p className="mt-2 text-[12px] font-semibold text-ink">완료 · 12건 처리 · 0.9s</p>
      </div>
    </div>
  );
}

// 카카오톡 챗봇 대화 흐름
export function ChatbotFlow() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-e2)]">
      <PanelHead title="카카오톡 예약봇" right="24시간" />
      <div className="space-y-2.5 p-4">
        <div className="w-fit max-w-[88%] rounded-2xl rounded-bl-md bg-paper-dim px-3.5 py-2 text-[13px] text-ink">
          예약 가능한 시간 알려주세요
        </div>
        <div className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-[13px] text-on-accent">
          오늘 15:00 / 17:00 / 19:00 비어 있어요
        </div>
        <div className="w-fit max-w-[88%] rounded-2xl rounded-bl-md bg-paper-dim px-3.5 py-2 text-[13px] text-ink">
          17시로 잡아주세요
        </div>
      </div>
      <p className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-[12px] font-medium text-ink-soft">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        예약 확정 · 알림 발송 완료
      </p>
    </div>
  );
}

// API·웹훅 연동 — 세로 흐름
const FLOW = [
  { name: "주문 시스템", note: "새 주문 이벤트 발생" },
  { name: "결제 API 연동", note: "승인 확인 · 금액 검증" },
  { name: "정산 처리", note: "수수료 계산 · 장부 기록" },
  { name: "알림 · 시트", note: "카톡 발송 · 구글 시트 반영" },
];

export function WebhookFlow() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-paper p-5 shadow-[var(--shadow-e2)]">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-accent" />
        <p className="text-[13px] font-semibold text-ink">웹훅 연동</p>
        <span className="ml-auto text-[12px] font-medium text-ink-soft">실시간</span>
      </div>
      <ol className="relative flex-1">
        {FLOW.map((f, i) => (
          <li key={f.name} className="relative flex gap-4 pb-6 last:pb-0">
            {i < FLOW.length - 1 && (
              <span className="absolute left-[6px] top-5 bottom-1 w-px bg-line" aria-hidden />
            )}
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-accent bg-paper" />
            <div>
              <p className="text-[13px] font-semibold text-ink">{f.name}</p>
              <p className="mt-0.5 text-[12px] text-ink-soft">{f.note}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t border-line pt-3 text-[12px] text-ink-soft">
        이벤트가 생기면 자동 전달 · 실패하면 재시도 · 전부 로그로 남김
      </p>
    </div>
  );
}

// 운영·유지보수 — 상태 점검 패널
const CHECKS = [
  { name: "챗봇 응답", ok: true, meta: "정상 · 0.3s" },
  { name: "결제 웹훅", ok: true, meta: "정상 · 마지막 12분 전" },
  { name: "자동화 배치", ok: true, meta: "오늘 09:00 성공" },
  { name: "외부 API", ok: false, meta: "지연 감지 — 재시도 중" },
];

export function MonitorCard() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-[var(--shadow-e2)]">
      <PanelHead title="상태 점검" right="자동 모니터링" />
      <ul className="flex-1 divide-y divide-line">
        {CHECKS.map((c) => (
          <li key={c.name} className="flex items-center gap-3 px-4 py-3 text-[13px]">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${c.ok ? "bg-accent" : "bg-warning"}`}
              aria-hidden
            />
            <span className="flex-1 font-medium text-ink">{c.name}</span>
            <span className="text-[11.5px] text-ink-soft">{c.meta}</span>
          </li>
        ))}
      </ul>
      <p className="border-t border-line px-4 py-2.5 text-[12px] text-ink-soft">
        문제가 생기면 즉시 알림 · 대부분 고객이 알기 전에 조치
      </p>
    </div>
  );
}

// 진행 단계 트래커 — 마이페이지의 실제 컴포넌트를 축약.
// 모바일: 세로 레일 / sm 이상: 가로 스텝.
const STAGES = ["문의", "기획·견적", "개발", "납품", "유지보수"];
export function ProgressTrackerMock({ current = 2 }: { current?: number }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-6 shadow-[var(--shadow-e2)]">
      <p className="text-[13px] font-semibold text-ink">프로젝트 진행 현황</p>

      {/* 모바일 — 세로 */}
      <ol className="mt-4 sm:hidden">
        {STAGES.map((s, i) => {
          const done = i <= current;
          return (
            <li key={s} className="relative flex gap-3 pb-3 last:pb-0">
              {i < STAGES.length - 1 && (
                <span
                  className={`absolute left-[5px] top-4 -bottom-0 w-px ${
                    i < current ? "bg-accent" : "bg-line"
                  }`}
                  aria-hidden
                />
              )}
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${done ? "bg-accent" : "bg-line"}`} />
              <span className={`text-[13px] ${done ? "font-semibold text-ink" : "text-ink-soft"}`}>
                {s}
              </span>
            </li>
          );
        })}
      </ol>

      {/* sm 이상 — 가로 */}
      <div className="mt-5 hidden items-start sm:flex">
        {STAGES.map((s, i) => {
          const done = i <= current;
          return (
            <div key={s} className="flex flex-1 items-start last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${done ? "bg-accent" : "bg-line"}`} />
                <span
                  className={`text-[12px] whitespace-nowrap ${
                    done ? "font-semibold text-ink" : "text-ink-soft"
                  }`}
                >
                  {s}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <span className={`mx-1.5 mt-1.5 h-px flex-1 ${i < current ? "bg-accent" : "bg-line"}`} />
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-5 border-t border-line pt-3 text-[12px] text-ink-soft">
        지금 <span className="font-semibold text-ink">개발</span> 단계 · 다음은{" "}
        <span className="font-semibold text-ink">납품</span>
      </p>
    </div>
  );
}
