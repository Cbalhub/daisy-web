import { revalidatePath } from "next/cache";

// 포트폴리오·후기 공개 페이지는 ISR(정적 캐시, 5분)로 서빙합니다 — 매 요청마다
// DB 를 치지 않아 첫 바이트가 빠릅니다. 대신 관리자가 글을 올리거나 고치면 5분을
// 기다리지 않고 바로 보이도록, 해당 뮤테이션 직후 관련 경로 캐시를 무효화합니다.
// 홈(/)에도 포트폴리오/후기 미리보기가 있어 함께 무효화합니다.

export function revalidatePortfolio() {
  revalidatePath("/");
  revalidatePath("/portfolio");
  revalidatePath("/portfolio/[slug]", "page");
}

export function revalidateReviews() {
  revalidatePath("/");
  revalidatePath("/reviews");
}
