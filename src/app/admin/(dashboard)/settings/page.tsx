import { AdminPageHeader, AdminCard } from "@/components/admin/ui/Card";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { getBusinessSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="pb-16">
      <AdminPageHeader title="설정" description="입금 계좌와 사업자 정보를 관리합니다." />
      <div className="space-y-8 px-4 sm:px-8 pt-6">
        <SettingsForm
          initial={{
            businessName: settings.businessName,
            representativeName: settings.representativeName,
            businessRegNo: settings.businessRegNo,
            mailOrderRegNo: settings.mailOrderRegNo,
            address: settings.address,
            phone: settings.phone,
            contactEmail: settings.contactEmail,
            businessHours: settings.businessHours,
            bankName: settings.bankName,
            bankAccountNumber: settings.bankAccountNumber,
            bankAccountHolder: settings.bankAccountHolder,
          }}
        />

        <AdminCard>
          <h2 className="text-sm font-semibold text-admin-text">비밀번호 변경</h2>
          <p className="mt-0.5 mb-4 text-xs text-admin-muted">관리자 로그인 비밀번호를 바꿉니다.</p>
          <ChangePasswordForm />
        </AdminCard>
      </div>
    </div>
  );
}
