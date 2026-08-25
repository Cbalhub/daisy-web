import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SERVICES } from "@/lib/content";
import { getBusinessSettings } from "@/lib/settings";

const COLUMNS = [
  {
    title: "서비스",
    links: [
      ...SERVICES.map((s) => ({ href: `/services#${s.slug}`, label: s.title })),
      { href: "/reviews", label: "고객 후기" },
    ],
  },
  {
    title: "회사",
    links: [
      { href: "/portfolio", label: "포트폴리오" },
      { href: "/faq", label: "자주 묻는 질문" },
      { href: "/contact", label: "문의하기" },
    ],
  },
  {
    title: "정책",
    links: [
      { href: "/terms", label: "이용약관" },
      { href: "/privacy", label: "개인정보처리방침" },
      { href: "/refund-policy", label: "환불 정책" },
    ],
  },
];

export async function Footer() {
  const settings = await getBusinessSettings();

  return (
    <footer className="mt-32 bg-ink text-paper">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <p className="font-display text-2xl font-semibold">
              OverCook<span className="text-accent">.</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/60">
              아이디어가 완성될 때까지, 끝까지 함께 끓이는 개발 파트너.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-paper/90">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-paper/60 transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 전자상거래법상 필수 표기 사항 — /admin/settings 에서 관리 */}
        <div className="mt-16 border-t border-paper/10 pt-8 text-xs leading-relaxed text-paper/40">
          <p>
            상호명: {settings.businessName}
            {settings.representativeName && ` · 대표: ${settings.representativeName}`}
            {settings.businessRegNo && ` · 사업자등록번호: ${settings.businessRegNo}`}
          </p>
          <p>
            {settings.mailOrderRegNo && `통신판매업신고번호: ${settings.mailOrderRegNo} · `}
            {settings.address && `주소: ${settings.address} · `}
            이메일:{" "}
            <a href={`mailto:${settings.contactEmail}`} className="hover:text-paper/70">
              {settings.contactEmail}
            </a>
            {settings.phone && ` · 대표전화: ${settings.phone}`}
          </p>
          <p className="mt-4">© {new Date().getFullYear()} OverCook. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
