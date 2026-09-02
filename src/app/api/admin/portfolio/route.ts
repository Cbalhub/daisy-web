import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { portfolioSchema } from "@/lib/validation/portfolio";
import { requireAdminSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import { revalidatePortfolio } from "@/lib/revalidate";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = portfolioSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 400 }
    );
  }

  const { published, body, mockup, ...rest } = parsed.data;

  try {
    const item = await prisma.portfolioItem.create({
      data: {
        ...rest,
        body: body || "",
        // Prisma Json? 필드는 JS null 을 직접 못 받습니다 — 비면 DbNull.
        mockup: mockup ?? Prisma.DbNull,
        publishedAt: published ? new Date() : null,
      },
    });
    revalidatePortfolio();
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "이미 사용 중인 슬러그입니다." }, { status: 409 });
    }
    throw err;
  }
}
