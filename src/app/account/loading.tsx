import { Container } from "@/components/ui/Container";

// 로그인 직후 /account 로 넘어올 때, 서버가 주문·계약을 조회하는 동안(force-dynamic
// 이라 매번 SSR) 페이지 모양의 스켈레톤을 즉시 보여줍니다. 추상적인 스피너보다
// 체감 로딩이 빠릅니다.
export default function AccountLoading() {
  return (
    <section className="pt-16 pb-24 md:pt-20" aria-hidden>
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-40 animate-pulse rounded-md bg-line/70" />
            <div className="h-4 w-56 animate-pulse rounded bg-line/50" />
          </div>
          <div className="h-9 w-20 animate-pulse rounded bg-line/50" />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-line bg-paper p-4">
              <div className="h-3 w-16 animate-pulse rounded bg-line/50" />
              <div className="mt-2.5 h-6 w-20 animate-pulse rounded bg-line/70" />
            </div>
          ))}
        </div>

        <div className="mt-10 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex items-center justify-between">
                <div className="h-5 w-48 animate-pulse rounded bg-line/70" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-line/50" />
              </div>
              <div className="mt-4 h-3 w-full animate-pulse rounded bg-line/40" />
              <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-line/40" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
