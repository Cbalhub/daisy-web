import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  buildContractSections,
  contractDisplayNumber,
  hashContractFacts,
  type CompanySnapshot,
} from "@/lib/contract";
import { ContractDocument, type ContractView } from "@/components/contract/ContractDocument";
import { SignForm } from "@/components/contract/SignForm";
import { PrintButton } from "@/components/payment/PrintButton";

export const dynamic = "force-dynamic";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const contract = await prisma.contract.findUnique({
    where: { token },
    include: { order: { select: { invoiceNumber: true } } },
  });

  // 초안(아직 발송 전)이거나 존재하지 않으면 유효하지 않은 링크로 취급합니다.
  if (!contract || contract.status === "DRAFT") notFound();

  const company = contract.companySnapshot as CompanySnapshot;

  const sections = buildContractSections({
    scope: contract.scope,
    amount: contract.amount,
    startDate: contract.startDate?.toISOString() ?? null,
    endDate: contract.endDate?.toISOString() ?? null,
    warrantyMonths: contract.warrantyMonths,
    paymentTerms: contract.paymentTerms,
    specialTerms: contract.specialTerms,
    client: { name: contract.clientName, bizNo: contract.clientBizNo },
    company,
  });

  // 서명본이면 저장된 해시를 지금 값으로 다시 계산해 비교합니다 — 일치하면 서명
  // 이후 금액·범위·서명이 바뀌지 않았다는 뜻(거래확인서와 같은 원리).
  let integrity: ContractView["integrity"] = "unavailable";
  if (contract.status === "SIGNED" && contract.contentHash && contract.signedAt) {
    const recomputed = hashContractFacts({
      contractId: contract.id,
      orderInvoiceNumber: contract.order.invoiceNumber,
      clientName: contract.clientName,
      clientEmail: contract.clientEmail,
      companyName: company.name,
      companyBizNo: company.bizNo,
      amount: contract.amount,
      scope: contract.scope,
      warrantyMonths: contract.warrantyMonths,
      startDate: contract.startDate?.toISOString() ?? "",
      endDate: contract.endDate?.toISOString() ?? "",
      signedName: contract.signedName ?? "",
      signedAt: contract.signedAt.toISOString(),
      signatureDataUrl: contract.signatureDataUrl ?? "",
    });
    integrity = recomputed === contract.contentHash ? "verified" : "mismatch";
  }

  const view: ContractView = {
    contractNumber: contractDisplayNumber(contract.id, contract.createdAt),
    status: contract.status,
    amount: contract.amount,
    company,
    client: {
      name: contract.clientName,
      bizNo: contract.clientBizNo,
      email: contract.clientEmail,
      phone: contract.clientPhone,
    },
    signedName: contract.signedName,
    signedAt: contract.signedAt?.toISOString() ?? null,
    signedIp: contract.signedIp,
    contentHash: contract.contentHash,
    signatureDataUrl: contract.signatureDataUrl,
    createdAt: contract.createdAt.toISOString(),
    sentAt: contract.sentAt?.toISOString() ?? null,
    integrity,
  };

  return (
    <div className="space-y-6">
      {contract.status === "VOID" && (
        <div className="rounded-xl border border-line bg-paper p-4 text-sm text-muted">
          이 계약서는 무효 처리되었습니다. 새로 받으신 링크가 있다면 그 링크에서 확인해 주세요.
        </div>
      )}

      <div className="rounded-xl border border-line bg-paper p-6 shadow-[var(--shadow-e1)] print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-9">
        <ContractDocument sections={sections} view={view} />
      </div>

      {contract.status === "SENT" && (
        <div className="rounded-xl border border-line bg-paper p-6 shadow-[var(--shadow-e1)] print:hidden sm:p-8">
          <h2 className="text-base font-semibold text-ink">전자서명</h2>
          <p className="mt-1 text-sm text-muted">
            위 계약 내용을 확인하셨다면 아래에 서명해 주세요. 서명하면 계약이 체결되며, 이후에도 이
            페이지에서 서명본을 다시 볼 수 있습니다.
          </p>
          <SignForm token={contract.token} />
        </div>
      )}

      {contract.status === "SIGNED" && (
        <div className="flex flex-col items-center gap-3 print:hidden">
          <p className="text-sm text-muted">서명이 완료되었습니다. 계약서를 저장해 두세요.</p>
          <PrintButton />
        </div>
      )}
    </div>
  );
}
