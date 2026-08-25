import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * 은행/사업자 정보처럼 자주 안 바뀌지만 대표님이 코드 수정 없이 직접 바꿀 수
 * 있어야 하는 값들입니다. 항상 "singleton" 한 행만 존재하며, 없으면 기본값으로
 * 만들어 둡니다 — 최초 배포 시 별도 시드 스크립트를 실행할 필요가 없게 하기 위함입니다.
 */
export async function getBusinessSettings() {
  // find-then-create는 여러 페이지가 빌드 시점에 동시에 호출하면 경쟁 상태로
  // unique 제약 위반이 날 수 있어, upsert로 원자적으로 "있으면 가져오고 없으면
  // 만들기"를 처리합니다.
  return prisma.businessSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
}

export async function updateBusinessSettings(
  data: Partial<{
    businessName: string;
    representativeName: string;
    businessRegNo: string;
    mailOrderRegNo: string;
    address: string;
    phone: string;
    contactEmail: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
  }>
) {
  return prisma.businessSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
}
