import { UADataLike } from "../types/uadata";
import { DeviceInfo } from "../types/deviceInfo";
import { NavigatorWithUA } from "@/types/uadata";

function hasTouch(): boolean {
  if (typeof window === "undefined") return false; // SSR guard
  return (
    "ontouchstart" in window ||
    ((navigator as NavigatorWithUA).maxTouchPoints ?? 0) > 0 ||
    ((navigator as NavigatorWithUA).msMaxTouchPoints ?? 0) > 0
  );
}


export default function getDeviceInfoSync(): DeviceInfo {
  const userAgent = navigator.userAgent;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const uaData = (navigator as Navigator & { userAgentData?: UADataLike }).userAgentData;
  const brand = uaData?.brands?.find(b => b.brand && b.brand !== "Not?A_Brand")?.brand
             ?? uaData?.brands?.[0]?.brand
             ?? "";

  const platform =
    uaData?.platform
    ?? (/Android/i.test(userAgent) ? "Android"
      : /iPhone|iPad|iPod/i.test(userAgent) ? "iOS"
      : /Windows/i.test(userAgent) ? "Windows"
      : /Mac OS X|Macintosh/i.test(userAgent) ? "macOS"
      : /Linux/i.test(userAgent) ? "Linux"
      : "Web");

  return { name: [platform, brand].filter(Boolean).join(" • "), userAgent, timeZone, mobile: uaData?.mobile };
}


export function isLikelyHandheld(): boolean {
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  return hasTouch() || coarse;
}
