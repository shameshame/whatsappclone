// src/lib/error-utils.ts
import type { AppError } from "@/types/errors";

const isError = (error: unknown): error is Error =>
  typeof error === "object" && error !== null && "name" in error && "message" in error;

const isDOMException = (error: unknown): error is DOMException =>
  typeof DOMException !== "undefined" && error instanceof DOMException;

export async function httpErrorFromResponse(res: Response): Promise<AppError> {
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
  // WebAuthn / DOM paths
  if (isDOMException(error)) {
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
  if (isError(error)) {
    // Undici/Fetch often throws TypeError on network issues
    if (error.name === "TypeError") {
      return { kind: "network", message: "Network error. Check your connection.", cause: error };
    }
    return { kind: "unknown", message: error.message, cause: error };
  }

  return { kind: "unknown", message: "Unexpected error." };
}
