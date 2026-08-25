import { AdminPageHeader } from "@/components/admin/ui/Card";
import { OrderForm } from "@/components/admin/OrderForm";

export default function NewOrderPage() {
  return (
    <div className="pb-16">
      <AdminPageHeader title="새 주문 만들기" description="결제 요청을 생성하고 결제 링크를 발급합니다." />
      <div className="px-8 pt-6">
        <div className="max-w-2xl">
          <OrderForm />
        </div>
      </div>
    </div>
  );
}
