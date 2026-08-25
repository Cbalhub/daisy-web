"use client";

import { motion, useReducedMotion } from "framer-motion";

const PARTICLE_COLORS = ["var(--color-accent)", "var(--color-ink)", "var(--color-accent-soft)"];

export function SuccessCelebration() {
  const reduceMotion = useReducedMotion();
  const particles = reduceMotion ? [] : Array.from({ length: 10 });

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative flex h-20 w-20 items-center justify-center">
        {particles.map((_, i) => {
          const angle = (i / particles.length) * Math.PI * 2;
          const distance = 46 + (i % 3) * 10;
          return (
            <motion.span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full"
              style={{ background: PARTICLE_COLORS[i % PARTICLE_COLORS.length] }}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                scale: 0.4,
              }}
              transition={{ type: "spring", bounce: 0, duration: 0.7, delay: 0.15 }}
            />
          );
        })}

        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-paper"
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.25, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
