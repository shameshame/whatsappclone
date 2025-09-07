import { UADataLike } from "../types/uadata";

type DeviceInfo = { name: string; ua: string; tz: string; mobile?: boolean };

export default function getDeviceInfoSync(): DeviceInfo {
  const ua = navigator.userAgent;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const uaData = (navigator as Navigator & { userAgentData?: UADataLike }).userAgentData;
  const brand = uaData?.brands?.find(b => b.brand && b.brand !== "Not?A_Brand")?.brand
             ?? uaData?.brands?.[0]?.brand
             ?? "";

  const platform =
    uaData?.platform
    ?? (/Android/i.test(ua) ? "Android"
      : /iPhone|iPad|iPod/i.test(ua) ? "iOS"
      : /Windows/i.test(ua) ? "Windows"
      : /Mac OS X|Macintosh/i.test(ua) ? "macOS"
      : /Linux/i.test(ua) ? "Linux"
      : "Web");

  return { name: [platform, brand].filter(Boolean).join(" • "), ua, tz, mobile: uaData?.mobile };
}
