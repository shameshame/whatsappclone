type Base64URLString = string;

export type BytesLike = ArrayBufferLike | ArrayBufferView | Uint8Array;

export function toB64url(
  input: BytesLike
): Base64URLString {
  // normalize to Uint8Array without copying when possible
  const bytes =
    input instanceof Uint8Array
      ? input
      : ArrayBuffer.isView(input)
      ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
      : new Uint8Array(input);

  // Prefer Node Buffer when available (faster, no large string build)
  if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
    return Buffer.from(bytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  // Browser path
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}


// ---- Helpers (strict, browser-friendly) ----
export function toUTF8(value: BytesLike): Uint8Array { 
  if (value instanceof Uint8Array) return value;
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer);
  return new Uint8Array(value as ArrayBufferLike);
};

// Decode base64url -> ArrayBuffer
export const fromB64URL = (b64url: Base64URLString): ArrayBuffer => {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  // pad
  const padded = b64 + "===".slice((b64.length + 3) % 4);
  if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
    return Uint8Array.from(Buffer.from(padded, "base64")).buffer;
  }
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
};
