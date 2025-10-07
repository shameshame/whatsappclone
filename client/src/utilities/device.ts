import { UADataLike } from "../types/uadata";
import { DeviceInfo } from "../types/device";
import { NavigatorWithUA } from "@/types/uadata";


export type Platform = "iOS" | "Android" | "Windows" | "macOS" | "Linux" | "Web";

function hasTouch(): boolean {
  if (typeof window === "undefined") return false; // SSR guard
  return (
    "ontouchstart" in window ||
    ((navigator as NavigatorWithUA).maxTouchPoints ?? 0) > 0 ||
    ((navigator as NavigatorWithUA).msMaxTouchPoints ?? 0) > 0
  );
}


export function getDevicePlatform(
  uaData?: UADataLike,
  userAgent?: string
): Platform {
  if (uaData?.platform) {
    // Normalize common UA-CH platforms
    const p = uaData.platform.toLowerCase();
    if (p.includes("android")) return "Android";
    if (p.includes("ios")) return "iOS";
    if (p.includes("mac")) return "macOS";
    if (p.includes("win")) return "Windows";
    if (p.includes("linux")) return "Linux";
    return "Web";
  }

  const ua = (userAgent || "").toLowerCase();
  if (/android/.test(ua)) return "Android";
  if (/iphone|ipad|ipod/.test(ua)) return "iOS";
  if (/mac os x|macintosh/.test(ua)) return "macOS";
  if (/windows/.test(ua)) return "Windows";
  if (/linux/.test(ua)) return "Linux";
  return "Web";
}


export default function getDeviceInfoSync(): DeviceInfo {
  const userAgent = navigator.userAgent;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const uaData = (navigator as Navigator & { userAgentData?: UADataLike }).userAgentData;
  const brand = uaData?.brands?.find(b => b.brand && b.brand !== "Not?A_Brand")?.brand
             ?? uaData?.brands?.[0]?.brand
             ?? "";

  const platform = getDevicePlatform(uaData,userAgent)

  return { name: [platform, brand].filter(Boolean).join(" • "), userAgent, timeZone, mobile: uaData?.mobile };
}

export function getIsMobile(uaData?: UADataLike, userAgent?: string): boolean {
  if (typeof uaData?.mobile === "boolean") return uaData.mobile;
  
  const ua = (userAgent || "").toLowerCase();
  return /\b(iphone|ipad|ipod|android)\b/.test(ua);
}


export function isLikelyHandheld(): boolean {
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  return hasTouch() || coarse;
}
