import "server-only";
import { createHash } from "crypto";

// 용역계약서 — 표준 템플릿입니다. 실제 계약 조건과 사업 형태에 맞게 법률 검토 후
// 사용하세요. 갑(발주자) = 고객, 을(수급자) = MOVD.

export type CompanySnapshot = {
  name: string;
  repName: string;
  bizNo: string;
  address: string;
  phone: string;
  email: string;
};

export function companySnapshotFromSettings(s: {
  businessName: string;
  representativeName: string;
  businessRegNo: string;
  address: string;
  phone: string;
  contactEmail: string;
}): CompanySnapshot {
  return {
    name: s.businessName || "MOVD",
    repName: s.representativeName || "",
    bizNo: s.businessRegNo || "",
    address: s.address || "",
    phone: s.phone || "",
    email: s.contactEmail || "",
  };
}

/**
 * 서명 시점의 핵심 사실을 정규화해 SHA-256을 계산합니다. 서명 이미지까지 포함해서,
 * 나중에 계약 금액·범위·서명이 바뀌면 해시가 달라져 위변조를 알 수 있습니다.
 * (거래확인서 document-hash.ts 와 같은 원리)
 */
export type ContractFacts = {
  contractId: string;
  orderInvoiceNumber: string;
  clientName: string;
  clientEmail: string;
  companyName: string;
  companyBizNo: string;
  amount: number;
  scope: string;
  warrantyMonths: number;
  startDate: string; // ISO or ""
  endDate: string; // ISO or ""
  signedName: string;
  signedAt: string; // ISO
  signatureDataUrl: string;
};

export function hashContractFacts(f: ContractFacts): string {
  const canonical = [
    f.contractId,
    f.orderInvoiceNumber,
    f.clientName,
    f.clientEmail,
    f.companyName,
    f.companyBizNo,
    String(f.amount),
    f.scope.replace(/\s+/g, " ").trim(),
    String(f.warrantyMonths),
    f.startDate,
    f.endDate,
    f.signedName,
    f.signedAt,
    // 서명 이미지는 통째로 넣으면 canonical 이 지나치게 길어져 이미지의 해시만 넣습니다.
    createHash("sha256").update(f.signatureDataUrl || "", "utf8").digest("hex"),
  ].join("|");
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

// ── 계약서 조항 렌더 ──────────────────────────────────────────

const KRW = (n: number) => `₩${n.toLocaleString("ko-KR")}`;
const DATE = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date(iso)) : "협의";

export type ContractSection = { title: string; body: string[] };

export function buildContractSections(d: {
  scope: string;
  amount: number;
  startDate: string | null;
  endDate: string | null;
  warrantyMonths: number;
  paymentTerms: string | null;
  specialTerms: string | null;
  client: { name: string; bizNo: string | null };
  company: CompanySnapshot;
}): ContractSection[] {
  const scopeLines = d.scope.split("\n").map((s) => s.trim()).filter(Boolean);

  const sections: ContractSection[] = [
    {
      title: "제1조 (목적)",
      body: [
        `이 계약은 갑(${d.client.name})이 을(${d.company.name})에게 소프트웨어 개발 용역을 의뢰하고, 을이 이를 수행함에 있어 양 당사자의 권리·의무를 정함을 목적으로 한다.`,
      ],
    },
    {
      title: "제2조 (용역의 범위)",
      body: [
        "을이 수행하는 용역의 범위는 다음과 같다.",
        ...scopeLines.map((line) => `  - ${line}`),
        "위에 명시되지 않은 요청은 용역 범위에 포함되지 않으며, 필요한 경우 별도 협의하여 추가 견적으로 진행한다.",
      ],
    },
    {
      title: "제3조 (계약 기간)",
      body: [
        `착수 예정일: ${DATE(d.startDate)}`,
        `납품 예정일: ${DATE(d.endDate)}`,
        "일정은 갑의 자료 제공 지연, 범위 변경 등 을의 귀책이 아닌 사유로 조정될 수 있다.",
      ],
    },
    {
      title: "제4조 (계약 금액 및 지급)",
      body: [
        `계약 금액은 ${KRW(d.amount)}(부가가치세 별도)로 한다.`,
        d.paymentTerms
          ? `지급 조건: ${d.paymentTerms}`
          : "지급 조건: 계약 성립 시 안내되는 계좌로 무통장입금하며, 세부 시기는 별도 협의한다.",
        "갑이 정당한 사유 없이 대금 지급을 지체하는 경우, 을은 작업을 중단하거나 계약을 해지할 수 있다.",
      ],
    },
    {
      title: "제5조 (납품 및 검수)",
      body: [
        "을은 완성된 결과물(소스코드·실행물·필요 문서)을 갑에게 인도한다.",
        "갑은 인도일로부터 7일 이내에 검수 결과를 을에게 통지하여야 하며, 그 기간 내 통지가 없으면 검수가 완료된 것으로 본다.",
      ],
    },
    {
      title: "제6조 (하자보수)",
      body: [
        `검수 완료 후 ${d.warrantyMonths}개월간, 을은 계약 범위 내에서 발견된 오류를 무상으로 보수한다.`,
        "기능 추가, 사용 환경 변화, 제3자 서비스 변경으로 인한 작업은 무상 보수 범위에 포함되지 않으며 유지보수는 별도 계약으로 한다.",
      ],
    },
    {
      title: "제7조 (지식재산권)",
      body: [
        "결과물의 지식재산권은 계약 금액이 전액 지급 완료된 시점에 갑에게 귀속된다.",
        "다만 을이 계약 이전부터 보유하던 프레임워크·라이브러리·재사용 모듈 및 노하우는 을에게 유보되며, 오픈소스는 각 라이선스를 따른다.",
        "대금이 완납되지 않은 결과물의 권리는 을에게 있다.",
      ],
    },
    {
      title: "제8조 (비밀유지)",
      body: [
        "양 당사자는 이 계약과 관련하여 알게 된 상대방의 영업·기술·개인정보를 상대방의 서면 동의 없이 제3자에게 제공하거나 목적 외로 사용하지 않으며, 이 의무는 계약 종료 후 3년간 유효하다.",
      ],
    },
    {
      title: "제9조 (계약의 변경)",
      body: [
        "용역 범위·일정·금액의 변경은 양 당사자가 서면(채팅 기록 포함)으로 합의한 경우에만 효력이 있다.",
      ],
    },
    {
      title: "제10조 (계약의 해제·해지 및 환불)",
      body: [
        "일방의 계약 위반 시 상대방은 시정을 최고한 후 계약을 해지할 수 있다.",
        "계약 해지 시 이미 수행된 작업분(기성고)에 대한 대금은 정산하며, 단순 변심으로 인한 취소의 경우 수행된 작업분은 환불되지 않는다. 세부 사항은 을의 환불 정책을 따른다.",
      ],
    },
    {
      title: "제11조 (손해배상 및 책임의 제한)",
      body: [
        "을의 손해배상 책임은 이 계약의 계약 금액을 한도로 한다. 다만 을의 고의 또는 중대한 과실이 있는 경우에는 그러하지 아니하다.",
        "을은 갑이 결과물을 활용하여 발생한 영업손실 등 간접·특별·결과적 손해에 대해 책임지지 않는다.",
      ],
    },
    {
      title: "제12조 (불가항력)",
      body: [
        "천재지변, 전쟁, 정전, 제3자 서비스의 중대한 장애 등 당사자가 통제할 수 없는 사유로 인한 불이행에 대해서는 책임을 지지 않는다.",
      ],
    },
    {
      title: "제13조 (분쟁의 해결)",
      body: [
        "이 계약과 관련한 분쟁은 양 당사자가 우선 협의하여 해결하며, 협의가 이루어지지 않을 경우 을의 주소지를 관할하는 법원을 제1심 관할 법원으로 하고 대한민국 법령을 준거법으로 한다.",
      ],
    },
    {
      title: "제14조 (기타)",
      body: [
        "이 계약에 정하지 않은 사항은 관계 법령과 상관례에 따르며, 양 당사자가 협의하여 정한다.",
        "이 계약은 전자적 방법으로 체결되며, 갑의 전자서명과 서명 시각·접속 정보, 계약 내용의 무결성 해시로 성립을 증명한다.",
      ],
    },
  ];

  if (d.specialTerms && d.specialTerms.trim()) {
    sections.push({
      title: "특약사항",
      body: d.specialTerms.split("\n").map((s) => s.trim()).filter(Boolean),
    });
  }

  return sections;
}
