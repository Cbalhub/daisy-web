import { redirect } from "next/navigation";
import { requireCustomerSession } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// 문의는 이제 채팅 하나로 통일합니다 — 별도 문의 폼 대신, 로그인 여부에 따라
// 채팅 또는 로그인 페이지로 바로 보냅니다.
export default async function ContactPage() {
  const session = await requireCustomerSession();
  if (session?.customerId) {
    redirect("/chat");
  }
  redirect("/account/login?next=/chat");
}
