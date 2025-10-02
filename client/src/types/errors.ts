// src/types/errors.ts
export type AppErrorKind =
  | "webauthn-cancel"          // user canceled / no discoverable creds / timeout
  | "webauthn-security"        // RP/origin mismatch, insecure context, etc.
  | "webauthn-unsupported"     // no WebAuthn support
  | "http"                     // non-2xx response
  | "network"                  // fetch failed
  | "server"                   // server returned JSON with {ok:false, code}
  | "unknown";

export interface AppError {
  kind: AppErrorKind;
  message: string;
  status?: number;           // for HTTP errors
  code?: string;             // server code (e.g., "unknown-credential")
  cause?: Error;             // original error
}
