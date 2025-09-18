import { UADataLike } from "../types/uadata";
import { DeviceInfo } from "../types/deviceInfo";

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
