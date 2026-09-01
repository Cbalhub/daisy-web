import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SignupForm } from "@/components/account/SignupForm";

export const metadata: Metadata = {
  title: "회원가입",
};

export default function AccountSignupPage() {
  return (
    <section className="pt-16 pb-24 md:pt-24">
      <Container className="max-w-sm">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">회원가입</h1>
        <p className="mt-2 text-sm text-muted">
          가입하면 이전에 남긴 문의·주문 내역이 자동으로 연결됩니다.
        </p>

        <div className="mt-8 rounded-xl border border-line bg-paper p-6 shadow-[var(--shadow-e1)]">
          <SignupForm />
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/account/login" className="font-medium text-accent hover:opacity-70">
            로그인
          </Link>
        </p>
      </Container>
    </section>
  );
}
