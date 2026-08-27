import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { DaisyAsterisk } from "@/components/marketing/DaisyAsterisk";

export const metadata: Metadata = { title: "페이지를 찾을 수 없어요" };

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center pt-20 pb-24 md:pt-28">
      <Container>
        <div className="text-center">
          <Reveal>
            <DaisyAsterisk variant="mono" className="mx-auto h-16 w-16 text-accent/70" />
            <p className="mt-4 font-display text-6xl font-semibold tracking-tight text-accent md:text-7xl">
              404
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-balance md:text-3xl">
              페이지를 찾을 수 없어요
            </h1>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
              주소가 바뀌었거나 삭제된 페이지예요. 아래에서 원하시는 곳으로 이동해 주세요.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button href="/" size="md">
                홈으로
              </Button>
              <Button href="/portfolio" variant="secondary" size="md">
                포트폴리오 보기
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
