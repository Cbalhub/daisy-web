import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listCustomerConversations, createConversation } from "@/lib/chat";
import { requireCustomerSession } from "@/lib/customer-auth";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireCustomerSession();
  if (!session?.customerId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const conversations = await listCustomerConversations(session.customerId);
  return NextResponse.json({ ok: true, conversations });
}

const postSchema = z.object({ title: z.string().trim().max(60).optional() });

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "invalid origin" }, { status: 403 });
  }

  const session = await requireCustomerSession();
  if (!session?.customerId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const parsed = postSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const conversation = await createConversation(session.customerId, parsed.data.title);
  return NextResponse.json({ ok: true, conversation });
}
