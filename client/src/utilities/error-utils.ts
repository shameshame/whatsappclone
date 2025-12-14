// src/lib/error-utils.ts
import type { AppError,HttpAppError } from "@/types/errors";


//Error Guards
function isHttpAppError(error: unknown): error is HttpAppError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as any).kind === "http" &&
    typeof (error as any).status === "number" &&
    typeof (error as any).message === "string"
  );
}


function isDomException(error: unknown): error is DOMException {
  return typeof DOMException !== "undefined" && error instanceof DOMException;
}


//Mapping DOMException to AppError
function mapDomException(error: DOMException): AppError {
  switch (error.name) {
    case "NotAllowedError":
    case "AbortError":
    case "TimeoutError":
      return {
        kind: "webauthn-cancel",
        message: "Passkey prompt was canceled or timed out.",
        cause: error,
      };

    case "SecurityError":
      return {
        kind: "webauthn-security",
        message: "Security error. Check domain and HTTPS.",
        cause: error,
      };

    case "NotSupportedError":
      return {
        kind: "webauthn-unsupported",
        message: "WebAuthn not supported on this device.",
        cause: error,
      };

    default:
      return {
        kind: "unknown",
        message: `${error.name}: ${error.message}`,
        cause: error,
      };
  }
}

function mapJsError(error: Error): AppError {
  // Fetch/network errors often surface as TypeError
  if (error.name === "TypeError") {
    return {
      kind: "network",
      message: "Network error. Check your connection.",
      cause: error,
    };
  }

  return {
    kind: "unknown",
    message: error.message,
    cause: error,
  };
}



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
  // 1. Already-normalized HTTP error
  if (isHttpAppError(error)) {
    return error;
  }

  // 2. WebAuthn / DOMException
  if (isDomException(error)) {
    return mapDomException(error);
  }

  // 3. Standard JS Error (network, runtime, etc.)
  if (error instanceof Error) {
    return mapJsError(error);
  }

  // 4. Truly unknown
  return {
    kind: "unknown",
    message: "Unexpected error.",
  };
}

export function requiresAuth(error: unknown) {
  return isHttpAppError(error) && (error.status === 401 || error.status === 419);
}





