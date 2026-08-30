import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "@/components/account/LoginForm";

export const metadata: Metadata = {
  title: "로그인",
};

export default function AccountLoginPage() {
  return (
    <section className="pt-20 pb-24 md:pt-28">
      <Container className="max-w-sm">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance md:text-3xl">
          로그인
        </h1>
        <p className="mt-3 text-sm text-muted">
          문의·주문 내역을 한곳에서 확인할 수 있습니다.
        </p>

        <div className="mt-10">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          아직 계정이 없으신가요?{" "}
          <Link href="/account/signup" className="font-medium text-accent hover:opacity-70">
            회원가입
          </Link>
        </p>
      </Container>
    </section>
  );
}
