"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 22, stiffness: 90 });
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.round(latest).toLocaleString("ko-KR")}${suffix}`;
      }
    });
    return unsubscribe;
  }, [spring, prefix, suffix]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}0{suffix}
    </span>
  );
}
