import { AdminPageHeader } from "@/components/admin/ui/Card";
import { EventManager } from "@/components/admin/EventManager";
import { listAllEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function AdminEventPage() {
  const events = await listAllEvents();

  return (
    <div className="pb-16">
      <AdminPageHeader
        title="이벤트 팝업"
        description="사이트 진입 시 뜨는 팝업을 관리합니다. 여러 개를 켜두면 팝업 안에서 점(dot)으로 넘겨볼 수 있어요."
      />
      <div className="px-8 pt-6">
        <EventManager events={events} />
      </div>
    </div>
  );
}
