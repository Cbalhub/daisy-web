import { Container } from "@/components/ui/Container";
import { Mark } from "@/components/brand/Mark";

/* ── 4. "이런 걸 만들었어요" 마퀴 ────────────────────────────── */

const WORK_TYPES = [
  "카카오톡 챗봇",
  "텔레그램 봇",
  "디스코드 봇",
  "자동 판매 시스템",
  "데이터 크롤링",
  "업무 자동화",
  "관리자 대시보드",
  "API · 웹훅 연동",
  "재고 동기화",
  "정산 리포트 자동화",
  "실시간 채팅 상담",
  "예약 · 알림 봇",
];

export function WorkTypeMarquee() {
  const row = [...WORK_TYPES, ...WORK_TYPES];
  return (
    <div className="border-y border-line bg-paper-dim py-5">
      <p className="mb-3 text-center text-xs font-medium text-muted">
        지금까지 이런 것들을 만들었어요
      </p>
      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track gap-3">
          {row.map((t, i) => (
            <span
              key={i}
              className="whitespace-nowrap rounded-full border border-line bg-paper px-4 py-1.5 text-sm font-medium text-ink-soft"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 1+2+3. 다크 매니페스토 (오버사이즈 타이포 + 애스터리스크) ── */

export function Manifesto() {
  return (
    <section className="relative overflow-hidden bg-ink py-24 text-paper md:py-32">
      <Mark
        variant="mono"
        className="pointer-events-none absolute -right-14 -top-14 h-72 w-72 text-white/[0.05] md:h-96 md:w-96"
      />
      <Container>
        <p className="relative font-display text-[1.9rem] font-extrabold leading-[1.25] tracking-tight text-balance md:text-[2.9rem] md:leading-[1.18]">
          &ldquo;그 예산으로 되나요?&rdquo;
          <br />
          <span className="text-paper/50">되게 만드는 게 저희 일입니다.</span>
        </p>
        <p className="relative mt-7 max-w-lg text-sm leading-relaxed text-paper/60 md:text-[15px]">
          정해진 견적서를 들이밀기 전에, 예산부터 듣고 그 안에서 방법을 찾습니다.
        </p>
      </Container>
    </section>
  );
}

/* ── 5. 대표 소개 ─────────────────────────────────────────────── */

export function FounderNote() {
  return (
    <section className="border-t border-line py-20 md:py-28">
      <Container>
        <div className="grid gap-8 md:grid-cols-[auto_1fr] md:gap-12">
          {/* 사진이 준비되면 이 이니셜 아바타를 <Image> 로 교체하세요 */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-ink font-display text-2xl font-extrabold text-paper shadow-[var(--shadow-e2)]">
            황
          </div>
          <div className="max-w-2xl">
            <p className="font-display text-lg font-extrabold leading-relaxed tracking-tight text-balance md:text-xl">
              &ldquo;상담부터 개발, 배포까지 제가 직접 합니다. 중간에 담당자가 바뀌면 늘
              뭔가 새더라고요. 그게 싫어서 이렇게 해요.&rdquo;
            </p>
            <p className="mt-5 text-sm text-muted">
              <span className="font-semibold text-ink">황준성</span> · MOVD 대표
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
