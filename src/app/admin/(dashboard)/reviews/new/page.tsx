import { AdminPageHeader } from "@/components/admin/ui/Card";
import { ReviewForm } from "@/components/admin/ReviewForm";

export default function NewReviewPage() {
  return (
    <div className="pb-16">
      <AdminPageHeader title="새 후기 추가" />
      <div className="px-8 pt-6">
        <div className="max-w-2xl">
          <ReviewForm />
        </div>
      </div>
    </div>
  );
}
