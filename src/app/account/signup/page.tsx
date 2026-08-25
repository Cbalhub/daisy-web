import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SignupForm } from "@/components/account/SignupForm";

export const metadata: Metadata = {
  title: "회원가입",
};

export default function AccountSignupPage() {
  return (
    <section className="pt-20 pb-24 md:pt-28">
      <Container className="max-w-md">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance md:text-4xl">
          회원가입
        </h1>
        <p className="mt-3 text-sm text-muted">
          가입하시면 이전에 남기신 문의·주문 내역이 자동으로 연결됩니다.
        </p>

        <div className="mt-10">
          <SignupForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/account/login" className="font-medium text-accent hover:opacity-70">
            로그인
          </Link>
        </p>
      </Container>
    </section>
  );
}
