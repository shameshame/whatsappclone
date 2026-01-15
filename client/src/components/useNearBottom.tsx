import { RefObject, useEffect, useMemo } from "react";
import { debounce } from "@/utilities/scrollWindow";
import { isNearBottom } from "@/utilities/scrollWindow";

type UseNearBottomOpts = {
  thresholdPx?: number;
  debounceMs?: number;
  enabled?: boolean;
  onNearBottom: () => void | Promise<void>;
};

export function useNearBottom(
  ref: RefObject<HTMLElement | null>,
  {
    thresholdPx = 32,
    debounceMs = 350,
    enabled = true,
    onNearBottom,
  }: UseNearBottomOpts
) {
  const debounced = useMemo(
    () => debounce(() => void onNearBottom(), debounceMs),
    [onNearBottom, debounceMs]
  );

  useEffect(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;

    const onScroll = () => {
      if (isNearBottom(element, thresholdPx)) debounced();
    };

    element.addEventListener("scroll", onScroll, { passive: true });

    // run once on mount (if already at bottom)
    onScroll();

    return () => element.removeEventListener("scroll", onScroll);
  }, [ref, enabled, thresholdPx, debounced]);

  return { debouncedMark: debounced };
}
