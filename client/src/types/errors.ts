// src/types/errors.ts
export type WebAuthnErrorKind =
  | "webauthn-cancel"
  | "webauthn-security"
  | "webauthn-unsupported";

  export type UnknownAppError = {
    kind: "unknown";
    message: string;
    cause?: unknown;
  };


export type HttpAppError = {
  kind: "http";
  status: number;       // non-2xx HTTP status
  message: string;
  code?: string;        // server-sent error code (optional)
};

export type NetworkAppError = {
  kind: "network";      // fetch/undici/network failure
  message: string;
  cause?: unknown;
};

export type ServerAppError = {
  kind: "server";       // app-level failure with HTTP 200 { ok:false, code }
  message: string;
  code?: string;
  status?: number;      // optional HTTP status if applicable
};

export type WebAuthnAppError = {
  kind: WebAuthnErrorKind;
  message: string;
  cause?: DOMException;
};

export type AppError =
  | HttpAppError
  | NetworkAppError
  | ServerAppError
  | WebAuthnAppError
  | UnknownAppError;

