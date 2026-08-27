import { AdminPageHeader } from "@/components/admin/ui/Card";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getBusinessSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="pb-16">
      <AdminPageHeader title="설정" description="입금 계좌와 사업자 정보를 관리합니다." />
      <div className="px-8 pt-6">
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
      </div>
    </div>
  );
}
