import { AdminPageHeader } from "@/components/admin/ui/Card";
import { QuickReplyForm } from "@/components/admin/QuickReplyForm";

export default function NewQuickReplyPage() {
  return (
    <div className="pb-16">
      <AdminPageHeader title="새 빠른 답변 추가" />
      <div className="px-4 sm:px-8 pt-6">
        <div className="max-w-2xl">
          <QuickReplyForm />
        </div>
      </div>
    </div>
  );
}
