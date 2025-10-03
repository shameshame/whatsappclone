// src/lib/banner-map.ts
import type { AppError } from "@/types/errors";

export type BannerVariant = "default" | "warning" | "success" | "destructive";

export type BannerData ={
  msg: string;
  variant: BannerVariant;
}

export function bannerFromError(err: AppError): BannerData {
  switch (err.kind) {
    case "webauthn-cancel":
      return { msg: "No passkey found or the request was canceled. Create one to continue.", variant: "warning" };
    case "webauthn-security":
      return { msg: "Security error: make sure you’re on the same domain you registered with.", variant: "destructive" };
    case "webauthn-unsupported":
      return { msg: "Passkeys are not supported on this device or browser.", variant: "destructive" };
    case "network":
      return { msg: "Network error. Check your connection and try again.", variant: "warning" };
    case "http":
      if (err.status === 404 && err.code === "unknown-credential") {
        return { msg: "This device’s passkey isn’t registered here. Create one now.", variant: "warning" };
      }
      console.log("Error code",err.code)
      return { msg: err.message, variant: "destructive" };
    case "server":
      return { msg: err.message, variant: "destructive" };
    default:
      return { msg: err.message || "Something went wrong.", variant: "destructive" };
  }
}
