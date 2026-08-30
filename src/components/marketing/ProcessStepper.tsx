type Step = { step: string; title: string; description: string };

/**
 * 진행 과정 — 점을 잇는 실선 타임라인 + 번호. 정적, 무채색.
 * 모바일: 왼쪽 세로선. lg 이상: 위쪽 가로선.
 */
export function ProcessStepper({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="mt-14 grid gap-y-9 sm:grid-cols-2 lg:grid-cols-6 lg:gap-x-4">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.step} className="relative pl-8 lg:pl-0 lg:pt-9">
            {!last && (
              <span
                className="absolute left-[5px] top-3 -bottom-9 w-px bg-line sm:hidden"
                aria-hidden
              />
            )}
            {!last && (
              <span
                className="absolute left-3 right-0 top-[5px] hidden h-px bg-line lg:block"
                aria-hidden
              />
            )}
            <span
              className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-accent bg-paper lg:top-0"
              aria-hidden
            />
            <span className="font-display text-xs font-bold tabular-nums text-accent">
              {step.step}
            </span>
            <h3 className="mt-1 text-sm font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted lg:pr-3">{step.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
