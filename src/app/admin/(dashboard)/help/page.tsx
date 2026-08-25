import { AdminPageHeader } from "@/components/admin/ui/Card";
import { TaxGuide } from "@/components/admin/TaxGuide";
import { TaxCalculator } from "@/components/admin/TaxCalculator";

export default function AdminHelpPage() {
  return (
    <div className="pb-16">
      <AdminPageHeader
        title="세금 도움말"
        description="계좌·부가세·종합소득세 관련해서 대표님이 직접 정리해둔 참고용 메모예요. 실제 신고 전엔 홈택스 모의계산이나 세무사 확인을 거치세요."
      />
      <div className="grid grid-cols-1 gap-6 px-8 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <TaxGuide />
        <TaxCalculator />
      </div>
    </div>
  );
}
