export const isSessionId = (s: unknown): boolean =>
  typeof s === "string" && /^[0-9a-f-]{36}$/i.test(s); // UUID v4 style

export const isAuthCode = (s: unknown): boolean =>
  typeof s === "string" && /^[A-Za-z0-9_-]{20,120}$/.test(s); // base64url-ish