// passkeys.ts — usernameless passkey login helper (works on phone/desktop)
type PublicKeyCredentialRequestOptionsJSON = any;

// base64url helpers
const pad = (string: string) => string + "=".repeat((4 - (string.length % 4)) % 4);
const b64urlToBuf = (string: string) => Uint8Array.from(atob(pad(string.replace(/-/g, "+").replace(/_/g, "/"))), c => c.charCodeAt(0)).buffer;
const bufToB64url = (buf: ArrayBuffer) => {
  const bin = String.fromCharCode(...new Uint8Array(buf));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

function decodeGetOptions(opts: any): PublicKeyCredentialRequestOptions {
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

function publicKeyCredentialToJSON(cred: any): any {
  if (!cred) return null;
  if (cred instanceof ArrayBuffer) return bufToB64url(cred);
  if (cred.rawId instanceof ArrayBuffer) cred.rawId = bufToB64url(cred.rawId);
  if (cred.response) {
    const r = cred.response as any;
    if (r.clientDataJSON) r.clientDataJSON = bufToB64url(r.clientDataJSON);
    if (r.authenticatorData) r.authenticatorData = bufToB64url(r.authenticatorData);
    if (r.signature) r.signature = bufToB64url(r.signature);
    if (r.userHandle && r.userHandle instanceof ArrayBuffer) r.userHandle = bufToB64url(r.userHandle);
  }
  for (const k in cred) if (typeof cred[k] === "object") cred[k] = publicKeyCredentialToJSON(cred[k]);
  return cred;
}

async function postJSON<T>(url: string, body?: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",                // IMPORTANT: set cookies
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
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
