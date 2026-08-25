"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
    >
      인쇄 · PDF로 저장
    </button>
  );
}
