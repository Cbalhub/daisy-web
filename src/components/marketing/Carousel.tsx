"use client";

import { useEffect, useRef, useState } from "react";
import { RevealGroup } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

const PIXELS_PER_SECOND = 55;
// 터치로 멈춘 뒤 다시 흐르기 시작하기까지의 유예 시간 — 손을 뗀 직후 바로
// 움직이면 방금 읽던 카드가 훅 지나가버려서, 잠깐 읽을 시간을 줍니다.
const TOUCH_RESUME_DELAY_MS = 2000;

/**
 * 카드가 화면에 다 안 들어올 만큼 많을 때만 의미가 있는 가로 레일입니다.
 *
 * JS로 매 프레임 scrollLeft를 옮기는 방식은 브라우저가 백그라운드 탭의
 * requestAnimationFrame을 쓰로틀링하는 것과 얽혀 불안정했습니다. 그렇다고
 * CSS 애니메이션을 RevealGroup에 직접 걸면, Framer Motion이 그 요소의
 * transform을 인라인 스타일로 매 프레임 덮어써서 CSS 애니메이션이 씹힙니다
 * (같은 transform 속성을 두 시스템이 동시에 제어). 그래서 애니메이션 전용
 * 래퍼 요소를 하나 더 두고, 그 요소에만 순수 CSS transform 애니메이션을
 * 걸어 Framer Motion과 아예 겹치지 않게 분리했습니다 — RevealGroup은 그
 * 안에서 자기 자신의(y) transform만 독립적으로 다룹니다.
 *
 * 컨테이너를 실제로 스크롤 가능하게(overflow-x-auto) 만들지는 않습니다 —
 * 네이티브 scrollLeft와 이 transform 애니메이션이 같이 움직이면 둘이
 * 더해져서 카드가 화면 밖으로 튀어버립니다. 대신 터치/포인터로 누르고
 * 있는 동안은 애니메이션만 멈춰서(:hover가 안 먹는 터치 기기에서도) 읽을
 * 시간을 주고, 손을 떼면 잠깐 뒤 다시 흐르게 합니다.
 */
export function Carousel({
  children,
  stagger = 0.06,
}: {
  children: React.ReactNode;
  stagger?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [anim, setAnim] = useState<{ distance: number; duration: number } | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const distance = track.scrollWidth - track.clientWidth;
    setAnim(distance > 4 ? { distance, duration: distance / PIXELS_PER_SECOND } : null);
  }, [children]);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  function pauseNow() {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setPaused(true);
  }

  function scheduleResume() {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), TOUCH_RESUME_DELAY_MS);
  }

  return (
    <div
      ref={trackRef}
      className="-mx-4 overflow-hidden px-4 pb-2"
      onPointerDown={pauseNow}
      onPointerUp={scheduleResume}
      onPointerCancel={scheduleResume}
      onPointerLeave={scheduleResume}
    >
      <div
        className={cn(anim && "animate-scroll-x", paused && "[animation-play-state:paused]")}
        style={
          anim
            ? ({
                "--scroll-distance": `${-anim.distance}px`,
                "--scroll-duration": `${anim.duration}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <RevealGroup className="flex gap-6" stagger={stagger}>
          {children}
        </RevealGroup>
      </div>
    </div>
  );
}
