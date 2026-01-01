import { useRef, useCallback } from "react";

export function useLongPress(opts: {
  enabled: boolean;
  delay?: number;
  onLongPress: () => void;
  moveTolerancePx?: number;
}) {
  const { enabled, delay = 450, onLongPress, moveTolerancePx = 12 } = opts;

  const timerRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    startRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled) return;
      if (event.pointerType === "mouse") return;

      startRef.current = { x: event.clientX, y: event.clientY };

      clear();
      timerRef.current = window.setTimeout(() => onLongPress(), delay);
    },
    [enabled, delay, onLongPress, clear]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled) return;
      if (!startRef.current) return;

      const dx = Math.abs(event.clientX - startRef.current.x);
      const dy = Math.abs(event.clientY - startRef.current.y);

      if (dx > moveTolerancePx || dy > moveTolerancePx) clear();
    },
    [enabled, moveTolerancePx, clear]
  );

  const onPointerUp = useCallback(() => clear(), [clear]);
  const onPointerCancel = useCallback(() => clear(), [clear]);
  const onPointerLeave = useCallback(() => clear(), [clear]);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onPointerLeave };
}
