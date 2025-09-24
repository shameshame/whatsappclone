export const toB64url = (value: string | Uint8Array | ArrayBufferLike): string => {
  if (typeof value === "string") {
    // simplewebauthn already gives credential.id as base64url in newer versions
    // Optionally normalize standard base64 -> base64url:
    return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  const u8 = value instanceof Uint8Array ? value : new Uint8Array(value);
  return Buffer.from(u8).toString("base64url");
};