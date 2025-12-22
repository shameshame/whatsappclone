import { useRef, useCallback } from "react";

export function useLongPress(opts: {
  enabled: boolean;
  delay?: number;
  onLongPress: () => void;
}) {
  const { enabled, delay = 450, onLongPress } = opts;
  const timerRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled) return;
      if (event.pointerType === "mouse") return; // avoid desktop
      clear();
      timerRef.current = window.setTimeout(() => onLongPress(), delay);
    },
    [enabled, delay, onLongPress, clear]
  );

  const onPointerUp = useCallback(() => clear(), [clear]);
  const onPointerCancel = useCallback(() => clear(), [clear]);
  const onPointerLeave = useCallback(() => clear(), [clear]);

  return { onPointerDown, onPointerUp, onPointerCancel, onPointerLeave };
}
