import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getBusinessSettings } from "@/lib/settings";
import { DaisyAsterisk } from "@/components/marketing/DaisyAsterisk";

const PRIMARY_LINKS = [
  { href: "/services", label: "서비스" },
  { href: "/portfolio", label: "포트폴리오" },
  { href: "/reviews", label: "후기" },
  { href: "/faq", label: "자주 묻는 질문" },
  { href: "/contact", label: "문의하기" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/refund-policy", label: "환불 정책" },
];

export async function Footer() {
  const settings = await getBusinessSettings();

  return (
    <footer className="border-t border-line bg-paper">
      <Container className="py-14">
        {/* 마스트헤드 — 큰 워드마크 + 한 줄 태그라인 */}
        <div className="flex items-center gap-2.5">
          <DaisyAsterisk variant="color" className="h-6 w-6" />
          <p className="font-display text-xl font-semibold tracking-tight">Daisy</p>
        </div>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          업무 자동화·챗봇·외주 개발을 기획부터 운영까지. 대표가 직접 진행합니다.
        </p>

        {/* 링크 — 4열 사이트맵 대신 한 줄로 */}
        <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5 text-sm">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <span className="text-line" aria-hidden>
            ·
          </span>
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 전자상거래법상 필수 표기 사항 — /admin/settings 에서 관리 */}
        <div className="mt-10 border-t border-line pt-6 text-[11px] leading-relaxed text-muted">
          <p>
            상호명: {settings.businessName}
            {settings.representativeName && ` · 대표: ${settings.representativeName}`}
            {settings.businessRegNo && ` · 사업자등록번호: ${settings.businessRegNo}`}
          </p>
          <p className="mt-1">
            {settings.mailOrderRegNo && `통신판매업신고번호: ${settings.mailOrderRegNo} · `}
            {settings.address && `주소: ${settings.address} · `}
            이메일:{" "}
            <a href={`mailto:${settings.contactEmail}`} className="hover:text-ink">
              {settings.contactEmail}
            </a>
            {settings.phone && ` · 대표전화: ${settings.phone}`}
            {settings.businessHours && ` · 영업시간: ${settings.businessHours}`}
          </p>
          <p className="mt-3">© {new Date().getFullYear()} Daisy. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
