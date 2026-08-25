import { AdminPageHeader } from "@/components/admin/ui/Card";
import { PortfolioForm } from "@/components/admin/PortfolioForm";

export default function NewPortfolioPage() {
  return (
    <div className="pb-16">
      <AdminPageHeader title="새 포트폴리오 항목" />
      <div className="px-8 pt-6">
        <div className="max-w-3xl">
          <PortfolioForm />
        </div>
      </div>
    </div>
  );
}
