// src/lib/error-utils.ts
import type { AppError,HttpAppError } from "@/types/errors";


export async function httpErrorFromResponse(res: Response): Promise<HttpAppError> {
  let code: string | undefined;
  let message: string | undefined;
  try {
    const body = await res.clone().json() as { code?: string; message?: string };
    code = body.code;
    message = body.message;
  } catch { /* ignore non-JSON */ }

  return {
    kind: "http",
    status: res.status,
    code,
    message: message || `HTTP ${res.status} ${res.statusText}`,
  };
}

export function toAppError(error: unknown): AppError {
  // Normalize already-normalized HTTP errors
  if (typeof error === "object" && error !== null && (error as any).kind === "http") {
    return error as HttpAppError;
  }
  
  
  
  // WebAuthn / DOM paths
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "AbortError":
      case "TimeoutError":
        return { kind: "webauthn-cancel", message: "Passkey prompt was canceled or timed out.", cause: error };
      case "SecurityError":
        return { kind: "webauthn-security", message: "Security error. Check domain and HTTPS.", cause: error };
      case "NotSupportedError":
        return { kind: "webauthn-unsupported", message: "WebAuthn not supported on this device.", cause: error };
      default:
        return { kind: "unknown", message: `${error.name}: ${error.message}`, cause: error };
    }
  }

  // Regular Error (fetch/network/parsing/etc.)
  if (error instanceof Error) {
    if (error.name === "TypeError") {
      return { kind: "network", message: "Network error. Check your connection.", cause: error };
    }
    return { kind: "unknown", message: error.message, cause: error };
  }

  return { kind: "unknown", message: "Unexpected error." };
}
