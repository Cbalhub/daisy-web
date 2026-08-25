import { AdminCard } from "@/components/admin/ui/Card";
import { IconChevronRight } from "@/components/admin/icons";

type Topic = {
  title: string;
  summary: string;
  body: React.ReactNode;
  defaultOpen?: boolean;
};

const TOPICS: Topic[] = [
  {
    title: "입금받는 계좌, 왜 잔액을 오래 두면 안 되나",
    summary: "지급정지(계좌 얼림) 리스크와 그걸 줄이는 습관",
    defaultOpen: true,
    body: (
      <>
        <p>
          사업용 계좌로 낯선 입금(오입금·사기 관련 자금 등)이 들어오고 그게 나중에 신고되면,
          대표님이 전혀 몰랐어도 은행이 계좌를 통째로 지급정지시킬 수 있어요(전기통신금융사기
          피해방지법). 이건 계좌 안에 있는 <strong>특정 금액만 콕 집어 얼리는 게 아니라, 그
          시점의 잔액 전체</strong>가 묶이는 구조예요.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-4">
          <li>확인되지 않은 입금은 절대 손대지 말고, 의심되면 은행에 먼저 연락하기</li>
          <li>
            확인된 진짜 매출은 주기적으로(매주·매달) 다른 계좌로 옮겨두기 — 잔액을 낮게
            유지하면 최악의 경우에도 묶이는 돈이 적어져요
          </li>
          <li>혹시 지급정지가 걸리면 &ldquo;이의제기&rdquo; 절차로 풀 수 있어요. 주문 기록·채팅
            로그·입금자명 매칭 내역이 결정적 증거가 돼요</li>
        </ul>
      </>
    ),
  },
  {
    title: "개인사업자 vs 법인 — 계좌에서 돈 옮길 때",
    summary: "사업용 계좌에서 내 다른 계좌로 옮길 때 장부 처리가 다름",
    body: (
      <>
        <p>
          <strong>개인사업자라면</strong> 사업용 계좌 → 대표님 다른 계좌로 옮기는 건 그냥 내
          돈을 내가 옮기는 거예요. 장부엔 <strong>&ldquo;인출금&rdquo;</strong>으로 처리하면 끝 — 비용도
          아니고 세금 계산에도 영향 없어요.
        </p>
        <p className="mt-3">
          <strong>법인이라면</strong> 얘기가 달라요. 법인 계좌에서 대표 개인 계좌로 그냥
          옮기면 <strong>&ldquo;가지급금&rdquo;</strong>으로 잡혀서, 나중에 국세청이 이자를 받은 걸로
          간주해 과세하는 <strong>인정이자</strong> 문제가 생길 수 있어요. 법인은 급여·배당
          같은 정식 절차로 빼야 하고, 이 부분은 꼭 세무사한테 확인하는 걸 추천해요.
        </p>
      </>
    ),
  },
  {
    title: "부가가치세(VAT) — 매출에 붙는 세금",
    summary: "매출세액 - 매입세액, 신고 일정, 매입세액공제 챙기는 법",
    body: (
      <>
        <p>
          일반과세자는 <strong>매출세액(매출×10%) − 매입세액(사업용 지출 중 부가세로 낸
          부분)</strong>을 계산해서 그 차액을 냅니다. 매입세액이 더 크면 오히려 환급받아요.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-4">
          <li>
            <strong>확정신고</strong>: 7월(1~6월분), 다음해 1월(7~12월분) — 직접 신고서 작성
          </li>
          <li>
            <strong>예정고지</strong>: 4월, 10월 — 국세청이 직전 확정신고 세액 기준으로 알아서
            청구, 신고서 작성 불필요
          </li>
          <li>
            매입세액공제를 챙기려면 서버비·AI 구독료·장비 등 사업용 지출은 반드시{" "}
            <strong>사업자 카드로 결제</strong>하고 세금계산서/현금영수증 증빙을 모아두세요
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "종합소득세 — 번 돈에 붙는 세금",
    summary: "매출이 아니라 순이익 기준, 누진세율, 1년 합산",
    body: (
      <>
        <p>
          매출이 아니라 <strong>순이익(매출 − 경비)</strong>에 과세돼요. 그리고 1년치 순이익을
          다 합산해서 — 다른 소득(근로소득 등)이 있다면 그것도 합쳐서 — 다음해{" "}
          <strong>5월에 한 번에 신고</strong>합니다. 거래 하나마다 세금이 찍히는 게 아니에요.
        </p>
        <p className="mt-3">
          세율은 <strong>누진세율(6~45%)</strong>이라 벌수록 초과분에 붙는 세율이 올라가요.
          아래 계산기에서 대략적인 예상 세액을 확인할 수 있어요.
        </p>
        <p className="mt-3">
          <strong>환급</strong>은 미리 낸 세금(원천징수 3.3%, 중간예납 등)이 실제 낼 세금보다
          많을 때만 나와요. 세금계산서로 정상 거래하는 구조면 미리 뗀 게 없어서 보통은 신고 후
          <strong> 납부</strong>하는 쪽이에요.
        </p>
      </>
    ),
  },
  {
    title: "지금 당장 잡아야 할 습관",
    summary: "매출 들어오면 바로 이렇게 나눠두기",
    body: (
      <ol className="list-decimal space-y-2 pl-4">
        <li>매출 들어오면 <strong>10%는 부가세용</strong> 계좌로 바로 분리</li>
        <li>
          남은 것 중 <strong>10~15%는 종합소득세 대비용</strong>으로 또 분리해서 모아두기 (사업
          잘돼서 순이익 규모가 커지면 20~25%로 올리기)
        </li>
        <li>나머지가 진짜 자유롭게 쓸 수 있는 돈</li>
        <li>사업용 지출은 무조건 사업자 카드로 — 매입세액공제 + 경비 처리가 한 번에 됨</li>
        <li>
          <strong>노란우산공제</strong> 가입 고려 — 매달 넣는 만큼 소득공제되고, 나중에 목돈으로
          찾을 수도 있어요
        </li>
        <li>매출 규모가 커지면 세무사 껴서 기장 — 절세되는 금액이 기장료보다 큰 경우가 많음</li>
      </ol>
    ),
  },
];

export function TaxGuide() {
  return (
    <div className="space-y-3">
      {TOPICS.map((topic) => (
        <AdminCard key={topic.title} className="p-0">
          <details className="group" open={topic.defaultOpen}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 marker:content-none">
              <div>
                <h3 className="text-sm font-semibold text-admin-text">{topic.title}</h3>
                <p className="mt-1 text-xs text-admin-muted">{topic.summary}</p>
              </div>
              <IconChevronRight className="h-4 w-4 shrink-0 text-admin-muted transition-transform duration-200 group-open:rotate-90" />
            </summary>
            <div className="space-y-1 px-6 pb-6 text-sm leading-relaxed text-admin-muted">
              {topic.body}
            </div>
          </details>
        </AdminCard>
      ))}
    </div>
  );
}
