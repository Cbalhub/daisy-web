"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "draw" | "type";

/**
 * 계약 서명판. 두 가지 방식:
 * - 그리기: 마우스·터치·펜을 pointer 이벤트로 받아 캔버스에 그림
 * - 입력: 위에서 입력한 성함을 서명체로 캔버스에 렌더 (마우스·터치를 못 쓰는
 *   사용자도 서명할 수 있게 — 접근성)
 * 어느 쪽이든 결과 PNG data URL 을 onChange 로 올려보냅니다.
 * 화면 회전·리사이즈로 캔버스 크기가 바뀌면 그린 내용을 새 크기에 맞춰 다시 그립니다.
 */
export function SignaturePad({
  onChange,
  typedName,
}: {
  onChange: (dataUrl: string | null) => void;
  typedName: string;
}) {
  const [mode, setMode] = useState<Mode>("draw");
  const [drawInk, setDrawInk] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const trimmedName = typedName.trim();
  const hasContent = mode === "draw" ? drawInk : trimmedName.length > 0;

  const prepareContext = useCallback((preserve: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width * ratio);
    const h = Math.round(rect.height * ratio);

    if (canvas.width !== w || canvas.height !== h) {
      let snapshot: HTMLCanvasElement | null = null;
      if (preserve && canvas.width > 0 && canvas.height > 0) {
        snapshot = document.createElement("canvas");
        snapshot.width = canvas.width;
        snapshot.height = canvas.height;
        snapshot.getContext("2d")?.drawImage(canvas, 0, 0);
      }
      canvas.width = w;
      canvas.height = h;
      if (snapshot) ctx.drawImage(snapshot, 0, 0, w, h);
    }

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#191919";
    return { ctx, width: rect.width, height: rect.height };
  }, []);

  // 그리기 모드: 캔버스 리사이즈(회전 등) 대응 — 그린 내용을 새 크기에 맞춰 재배치
  useEffect(() => {
    if (mode !== "draw") return;
    prepareContext(true);
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      prepareContext(true);
      if (!drawing.current && drawInk && canvasRef.current) {
        onChange(canvasRef.current.toDataURL("image/png"));
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [mode, drawInk, prepareContext, onChange]);

  // 입력 모드: 성함을 서명체로 캔버스에 렌더 (DOM 업데이트 + 부모 상태 동기화)
  useEffect(() => {
    if (mode !== "type") return;
    const prepared = prepareContext(false);
    if (!prepared) return;
    const { ctx, width, height } = prepared;
    ctx.clearRect(0, 0, width, height);
    if (!trimmedName) {
      onChange(null);
      return;
    }
    ctx.fillStyle = "#191919";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    let size = 34;
    while (size > 16) {
      ctx.font = `italic ${size}px Georgia, "Times New Roman", serif`;
      if (ctx.measureText(trimmedName).width <= width - 32) break;
      size -= 2;
    }
    ctx.fillText(trimmedName, width / 2, height / 2);
    onChange(canvasRef.current!.toDataURL("image/png"));
  }, [mode, trimmedName, prepareContext, onChange]);

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== "draw") return;
    e.preventDefault();
    drawing.current = true;
    last.current = pointFromEvent(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== "draw" || !drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!drawInk) setDrawInk(true);
  }

  function end() {
    if (mode !== "draw" || !drawing.current) return;
    drawing.current = false;
    last.current = null;
    if (canvasRef.current && drawInk) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clearDraw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawInk(false);
    onChange(null);
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setDrawInk(false);
    onChange(null);
    setMode(next);
  }

  const tabCls = (active: boolean) =>
    cn(
      "flex-1 rounded-md px-3 py-1.5 font-medium transition-colors",
      active ? "bg-accent text-on-accent" : "text-muted hover:text-ink"
    );

  return (
    <div>
      <div className="mb-2 flex gap-1 rounded-lg border border-line p-1 text-xs">
        <button type="button" onClick={() => switchMode("draw")} className={tabCls(mode === "draw")}>
          그려서 서명
        </button>
        <button type="button" onClick={() => switchMode("type")} className={tabCls(mode === "type")}>
          입력해서 서명
        </button>
      </div>

      {mode === "type" && (
        <p className="mb-2 text-xs text-muted">
          위 &lsquo;서명하시는 분 성함&rsquo;에 입력한 이름이 서명으로 사용됩니다.
        </p>
      )}

      <div className="relative overflow-hidden rounded-lg border border-line bg-paper">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          className={cn("block h-40 w-full", mode === "draw" && "cursor-crosshair touch-none")}
        />
        {!hasContent && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-muted">
            {mode === "draw" ? "이곳에 서명해 주세요" : "위에 성함을 입력하면 여기에 표시됩니다"}
          </span>
        )}
        <span className="pointer-events-none absolute bottom-2 left-3 right-3 border-b border-dashed border-line" />
      </div>

      {mode === "draw" && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={clearDraw}
            disabled={!drawInk}
            className="text-xs font-medium text-muted transition-colors hover:text-ink disabled:opacity-40"
          >
            다시 서명
          </button>
        </div>
      )}
    </div>
  );
}
