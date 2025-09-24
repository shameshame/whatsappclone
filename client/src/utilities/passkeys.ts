// passkeys.ts — usernameless passkey login helper (works on phone/desktop)
type PublicKeyCredentialRequestOptionsJSON = any;

// base64url helpers
const pad = (string: string) => string + "=".repeat((4 - (string.length % 4)) % 4);
const b64urlToBuf = (string: string) => Uint8Array.from(atob(pad(string.replace(/-/g, "+").replace(/_/g, "/"))), c => c.charCodeAt(0)).buffer;
const bufToB64url = (buf: ArrayBuffer) => {
  const bin = String.fromCharCode(...new Uint8Array(buf));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};



function b64urlToArrayBuffer(b64url: string): ArrayBuffer {
    // Convert base64url -> base64
    const pad = (str: string) => str + "=".repeat((4 - (str.length % 4)) % 4);
    const b64 = pad(b64url.replace(/-/g, "+").replace(/_/g, "/"));
    const raw = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes.buffer;
}




export function arrayBufferToB64url(buf: ArrayBufferLike): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte); // byte: number
  const b64 = typeof btoa === "function"
    ? btoa(binary)
    : Buffer.from(binary, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// tiny fetch helper (keeps credentials + optional CSRF header)
export async function postJSON<T = any>(url: string, body: unknown,csrfToken?:string): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || res.statusText);
    }
    return (await res.json()) as T;
  }


export function decodeCreateOptions(options: any): PublicKeyCredentialCreationOptions {
     const out: any = { ...options };
     console.log("Options",options)
     console.log("Userid")
     out.challenge = b64urlToArrayBuffer(options.challenge);
     // user.id may come as a string from server libs; must be BufferSource
     out.user = {
     ...options.user,
     id: typeof options.user.id === "string" ? b64urlToArrayBuffer(options.user.id) : options.user.id,
     };
     if (Array.isArray(options.excludeCredentials)) {
     out.excludeCredentials = options.excludeCredentials.map((c: any) => ({
     ...c,
     id: typeof c.id === "string" ? new Uint8Array(b64urlToArrayBuffer(c.id)) : c.id,
     }));
     }
     if (options.hints) out.hints = options.hints;
     return out as PublicKeyCredentialCreationOptions;
}

export function decodeGetOptions(opts: any): PublicKeyCredentialRequestOptions {
  const out: any = { ...opts };
  out.challenge = b64urlToBuf(opts.challenge);
  if (Array.isArray(opts.allowCredentials)) {
    out.allowCredentials = opts.allowCredentials.map((c: any) => ({
      ...c,
      id: typeof c.id === "string" ? new Uint8Array(b64urlToBuf(c.id)) : c.id,
    }));
  }
  return out;
}


export function publicKeyCredentialToJSON(cred: any): any {
  if (!cred) return null;
  if (cred instanceof ArrayBuffer) return bufToB64url(cred);
  if (cred.rawId instanceof ArrayBuffer) cred.rawId = bufToB64url(cred.rawId);
  if (cred instanceof Uint8Array) return arrayBufferToB64url(cred.buffer);
  if (cred.response) {
    const response = cred.response as any;
    if (response.clientDataJSON) response.clientDataJSON = bufToB64url(response.clientDataJSON);
    if (response.authenticatorData) response.authenticatorData = bufToB64url(response.authenticatorData);
    if (response.signature) response.signature = bufToB64url(response.signature);
    if (response.userHandle && response.userHandle instanceof ArrayBuffer) response.userHandle = bufToB64url(response.userHandle);
  }
  for (const k in cred) if (typeof cred[k] === "object") cred[k] = publicKeyCredentialToJSON(cred[k]);
  return cred;
}




/** Logs the user in with a discoverable passkey (no handle needed). */
export async function loginWithPasskey(): Promise<void> {
  // Ask server for WebAuthn options (usernameless: no handle)
  const { options } = await postJSON<{ options: PublicKeyCredentialRequestOptionsJSON }>("/auth/passkey/login/options", {});
  const publicKey = decodeGetOptions(options);
  // Optional nicety: (publicKey as any).mediation = "optional";

  const assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
  if (!assertion) throw new Error("cancelled");

  const authResp = publicKeyCredentialToJSON(assertion);
  await postJSON("/auth/passkey/login/verify", { authResp }); // server sets httpOnly cookies
}
