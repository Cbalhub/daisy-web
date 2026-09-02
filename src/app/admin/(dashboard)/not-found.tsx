import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/ui/Card";

export default function AdminNotFound() {
  return (
    <div className="pb-16">
      <AdminPageHeader title="페이지를 찾을 수 없어요" description="주소가 바뀌었거나 삭제된 페이지예요." />
      <div className="px-4 sm:px-8 pt-6">
        <Link href="/admin" className="text-sm font-medium text-admin-blue hover:underline">
          대시보드로 돌아가기
        </Link>
      </div>
    </div>
  );
}
