import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { updateBusinessSettings } from "@/lib/settings";

export const runtime = "nodejs";

const schema = z.object({
  businessName: z.string().trim().max(100),
  representativeName: z.string().trim().max(50),
  businessRegNo: z.string().trim().max(30),
  mailOrderRegNo: z.string().trim().max(50),
  address: z.string().trim().max(200),
  phone: z.string().trim().max(30),
  contactEmail: z.string().trim().max(100),
  businessHours: z.string().trim().max(100),
  bankName: z.string().trim().max(30),
  bankAccountNumber: z.string().trim().max(50),
  bankAccountHolder: z.string().trim().max(30),
  // 폼에서 문자열로 옴 — 견적 금액 계산용 일당(원). 빈값·이상값은 0.
  dailyRateKrw: z.coerce.number().int().min(0).max(100_000_000).catch(0),
});

export async function PATCH(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session?.adminId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const settings = await updateBusinessSettings(parsed.data);

  // 푸터(사업자 정보)를 쓰는 홈/서비스/가격 등 마케팅 페이지는 정적으로 미리
  // 만들어져 있어서, 여기서 명시적으로 다시 생성하라고 알려주지 않으면 방금
  // 바꾼 내용이 반영 안 된 옛날 페이지가 계속 보입니다.
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, settings });
}
