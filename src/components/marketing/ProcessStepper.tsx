"use client";

import { motion } from "framer-motion";

type Step = { step: string; title: string; description: string };

const PETAL_COLORS = [
  "var(--color-petal-yellow)",
  "var(--color-petal-pink)",
  "var(--color-petal-purple)",
  "var(--color-petal-blue)",
  "var(--color-petal-mint)",
  "var(--color-petal-orange)",
];

const STAGGER = 0.15;
const SEGMENT_TRAVEL = 0.5;
// 등장 스태거(점 6개 + 마지막 텍스트)가 끝날 때까지 기다렸다가 흐르는
// 애니메이션을 시작해서, 둘이 서로 겹쳐 산만해지지 않게 합니다.
const ENTRANCE_DONE = 1.2;

/**
 * PROCESS 섹션의 점-실선 스텝퍼입니다. 두 종류의 모션이 함께 있습니다.
 * 1) 등장 시퀀스 — 점이 하나씩 자리 잡고 다음 점까지 선이 이어지는 것을
 *    왼쪽부터 차례차례, 한 번만 재생합니다.
 * 2) 진행 표시 애니메이션 — 등장이 끝난 뒤, 작은 점 하나가 첫 세그먼트부터
 *    마지막 세그먼트까지 순서대로 계속 흘러가며 무한 반복됩니다. 실제로 뭔가
 *    진행되고 있다는 느낌을 주는 상시 모션이라, 등장 애니메이션과는 별개로
 *    계속 움직입니다.
 */
export function ProcessStepper({ steps }: { steps: readonly Step[] }) {
  const segmentCount = steps.length - 1;

  return (
    <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-4">
      {steps.map((step, i) => (
        <div key={step.step}>
          <div className="flex items-center">
            <motion.span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: PETAL_COLORS[i % PETAL_COLORS.length] }}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.4, delay: i * STAGGER }}
            />
            {i < steps.length - 1 && (
              <span className="relative ml-1.5 hidden h-px flex-1 lg:block">
                <motion.span
                  className="absolute inset-0 bg-line"
                  style={{ transformOrigin: "left" }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.35, delay: i * STAGGER + 0.15, ease: "easeOut" }}
                />
                <motion.span
                  className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
                  style={{ background: PETAL_COLORS[i % PETAL_COLORS.length] }}
                  initial={{ left: "0%" }}
                  whileInView={{ left: "100%" }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: SEGMENT_TRAVEL,
                    delay: ENTRANCE_DONE + i * SEGMENT_TRAVEL,
                    repeat: Infinity,
                    repeatDelay: (segmentCount - 1) * SEGMENT_TRAVEL,
                    ease: "easeInOut",
                  }}
                />
              </span>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * STAGGER + 0.05 }}
          >
            <h3 className="mt-3 text-sm font-bold">{step.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{step.description}</p>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
