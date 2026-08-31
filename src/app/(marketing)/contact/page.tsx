import { redirect } from "next/navigation";

// 문의는 채팅 하나로 통일합니다. 로그인 여부는 /chat 이 알아서 처리하므로
// (미로그인 시 /account/login?next=/chat 으로 보냄) 여기서는 무조건 /chat 으로 보냅니다.
export default function ContactPage() {
  redirect("/chat");
}
