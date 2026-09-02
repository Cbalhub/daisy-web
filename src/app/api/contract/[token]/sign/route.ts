import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/csrf";
import { signContractSchema } from "@/lib/validation/contract";
import { hashContractFacts, isSentContractExpired, type CompanySnapshot } from "@/lib/contract";
import { sendSlackText } from "@/lib/slack";
import { sendOwnerNotification } from "@/lib/email";
import { clientIp } from "@/lib/request-ip";

export const runtime = "nodejs";

// 고객이 계약서에 서명합니다. 인증은 없지만 토큰이 있어야 하고, 같은 출처에서 온
// 요청이어야 하며, 이미 서명됐거나 무효인 계약서엔 다시 서명할 수 없습니다.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const { token } = await params;
  const parsed = signContractSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const contract = await prisma.contract.findUnique({ where: { token } });
  if (!contract) {
    return NextResponse.json({ error: "계약서를 찾을 수 없습니다." }, { status: 404 });
  }
  if (contract.status === "SIGNED") {
    return NextResponse.json({ error: "이미 서명이 완료된 계약서입니다." }, { status: 409 });
  }
  if (contract.status !== "SENT") {
    return NextResponse.json({ error: "서명할 수 없는 계약서입니다." }, { status: 400 });
  }
  if (isSentContractExpired(contract.sentAt)) {
    return NextResponse.json(
      { error: "서명 유효 기간이 지났습니다. 담당자에게 링크 재발송을 요청해 주세요." },
      { status: 410 }
    );
  }

  const { signedName, signatureDataUrl } = parsed.data;
  const signedAt = new Date();
  // 서명 증거로 저장되는 값 — 위조 가능한 XFF 맨 앞값 대신 프록시가 세운 값을 씁니다.
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const company = contract.companySnapshot as CompanySnapshot;
  const order = await prisma.order.findUnique({ where: { id: contract.orderId } });

  const contentHash = hashContractFacts({
    contractId: contract.id,
    orderInvoiceNumber: order?.invoiceNumber ?? "",
    clientName: contract.clientName,
    clientEmail: contract.clientEmail,
    companyName: company.name,
    companyBizNo: company.bizNo,
    amount: contract.amount,
    scope: contract.scope,
    warrantyMonths: contract.warrantyMonths,
    startDate: contract.startDate?.toISOString() ?? "",
    endDate: contract.endDate?.toISOString() ?? "",
    signedName,
    signedAt: signedAt.toISOString(),
    signatureDataUrl,
  });

  try {
    await prisma.$transaction(async (tx) => {
      // 동시에 두 번 눌러도 한 번만 서명되도록 status 조건을 걸어 갱신합니다.
      const updated = await tx.contract.updateMany({
        where: { id: contract.id, status: "SENT" },
        data: {
          status: "SIGNED",
          signedName,
          signatureDataUrl,
          signedAt,
          signedIp: ip,
          signedUserAgent: userAgent,
          contentHash,
        },
      });
      if (updated.count === 0) {
        throw new Error("ALREADY_SIGNED");
      }
      await tx.auditLog.create({
        data: {
          action: "contract.signed",
          targetType: "Contract",
          targetId: contract.id,
          metadata: {
            orderId: contract.orderId,
            signedName,
            signedAt: signedAt.toISOString(),
            ip,
            contentHash,
          },
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_SIGNED") {
      return NextResponse.json({ error: "이미 서명이 완료된 계약서입니다." }, { status: 409 });
    }
    throw err;
  }

  // 서명 완료를 대표님에게 바로 알립니다(Slack 푸시 + 이메일). 서버리스 환경에서
  // 응답 후 백그라운드 작업이 중단될 수 있어, 알림 전송까지 기다린 뒤 응답합니다.
  // 알림 각각의 실패는 무시합니다(서명은 이미 성공적으로 저장됨).
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const adminUrl = `${siteUrl}/admin/orders/${contract.orderId}`;
  const amountText = `₩${contract.amount.toLocaleString("ko-KR")}`;
  const orderTitle = order?.title ?? "프로젝트";
  await Promise.allSettled([
    sendSlackText(
      `✍️ 계약서 서명 완료 — ${contract.clientName} 님\n${orderTitle} · ${amountText}`,
      { url: adminUrl, urlLabel: "관리자에서 열기", username: "MOVD 계약", iconEmoji: ":writing_hand:" }
    ),
    sendOwnerNotification({
      subject: `[MOVD] 계약서 서명 완료 — ${orderTitle}`,
      bodyText: `${contract.clientName} 님이 "${orderTitle}" 계약서에 서명했습니다.\n금액: ${amountText}\n관리자: ${adminUrl}`,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
