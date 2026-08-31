import { OpenChatButton } from "@/components/chat/OpenChatButton";

/**
 * 페이지 하단 공통 CTA — 둥근 패널(카드) 대신 하이라이트 없는 조용한 마무리.
 * 위아래 헤어라인으로만 구분하고 큰 문장 + 버튼만 둡니다.
 */
export function CtaBand({
  title,
  description,
  cta = "프로젝트 문의",
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  cta?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-t border-line pt-16 text-center md:pt-20">
      <h2 className="mx-auto max-w-xl font-display text-2xl font-bold tracking-tight text-balance md:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <OpenChatButton>{cta}</OpenChatButton>
        {children}
      </div>
    </div>
  );
}
