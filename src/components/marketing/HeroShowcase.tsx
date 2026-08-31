import { DashboardPanel } from "@/components/marketing/DashboardPanel";
import { ChatMiniCard, AutomationCard } from "@/components/marketing/ProductMocks";

/**
 * 히어로 오른쪽 — MOVD가 실제로 만드는 화면 세 개(관리자 대시보드 · 실시간 상담 ·
 * 자동화 배치)를 살짝 겹쳐 기울여 보여주고, 각자 다른 위상으로 아주 느리게 떠다닙니다.
 * 아이콘·장식 없이 제품 화면만. prefers-reduced-motion 이면 움직임 정지.
 *
 * float 클래스가 transform 을 애니메이션하므로, 위치 잡는 transform(중앙 정렬)은
 * 바깥 래퍼가 맡고 float 은 안쪽 요소에만 겁니다.
 */
export function HeroShowcase() {
  return (
    <div className="relative">
      {/* 모바일/태블릿 — 대시보드 한 장 */}
      <div className="mx-auto max-w-sm lg:hidden">
        <div className="float-a">
          <DashboardPanel />
        </div>
      </div>

      {/* lg 이상 — 세 화면 겹침 */}
      <div className="relative hidden h-[28rem] lg:block">
        <div className="absolute left-0 top-2 w-56">
          <div className="float-b">
            <ChatMiniCard />
          </div>
        </div>
        <div className="absolute right-0 bottom-0 w-56">
          <div className="float-c">
            <AutomationCard />
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 w-[19.5rem] -translate-x-1/2 -translate-y-1/2">
          <div className="float-a [&>figure>div]:shadow-[var(--shadow-float)]">
            <DashboardPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
