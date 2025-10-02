// passkeys.ts — usernameless passkey login helper (works on phone/desktop)
import { DEFAULT_LOGIN_PASSKEY_API } from "./constants";
import { fromB64URL, toB64url,toUTF8 } from "./encodingDecoding";
import { httpErrorFromResponse,toAppError  } from "./error-utils";
import { PublicKeyCredentialRequestOptionsJSON } from "@/types/credential";

// --- coercers to fix the two type errors ---
const ATTESTATION_VALUES = ["none", "indirect", "direct", "enterprise"] as const;

// Some browsers expose getTransports() only on attestation response (WebAuthn L3)
type AttestationWithTransports = AuthenticatorAttestationResponse & {
  getTransports?: () => AuthenticatorTransport[];
};
// Note: adjust list to your lib.dom version if needed
const TRANSPORT_VALUES = ["usb", "nfc", "ble", "internal", "cable", "hybrid"] as const;

// Type guards for response kinds
const isAttestation = (response: AuthenticatorResponse): response is AuthenticatorAttestationResponse =>
  "attestationObject" in response;

const isAssertion = (response: AuthenticatorResponse): response is AuthenticatorAssertionResponse =>
  "authenticatorData" in response && "signature" in response;




function coerceTransports(
  arr?: readonly string[]
): AuthenticatorTransport[] | undefined {
  if (!arr) return undefined;
  const filtered = arr.filter(
    (t): t is AuthenticatorTransport =>
      (TRANSPORT_VALUES as readonly string[]).includes(t)
  );
  return filtered.length ? filtered : undefined;
}

function coerceAttestation(
  value?: string
): AttestationConveyancePreference | undefined {
  return ATTESTATION_VALUES.includes(value as any)
    ? (value as AttestationConveyancePreference)
    : undefined;
}

//Functions to export 

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
export async function postJSON<TOut, TIn = unknown>(path: string, body: TIn,csrfToken?:string,init?: RequestInit): Promise<TOut> {
    const url = path.startsWith("http")
    ? path
    : new URL(path.startsWith("/") ? path : `/${path}`, window.location.origin).toString();
  
  try{
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await httpErrorFromResponse(res);
    return (await res.json()) as TOut;
  }catch(error:unknown){
    
    // Re-throw normalized AppError so callers can map to UI
    if ("kind" in (error as object)) throw error as ReturnType<typeof httpErrorFromResponse>;
    throw toAppError(error);
  }
  
}


export function decodeCreateOptions(
  opts: PublicKeyCredentialCreationOptionsJSON
): PublicKeyCredentialCreationOptions {
  
  const out: PublicKeyCredentialCreationOptions = {
    rp: opts.rp,
    pubKeyCredParams: opts.pubKeyCredParams,
    challenge: fromB64URL(opts.challenge),
    user: {
      ...opts.user,
      id: typeof opts.user.id === "string" ? fromB64URL(opts.user.id) : opts.user.id,
    },
    timeout: opts.timeout,
    attestation: coerceAttestation(opts.attestation), // ✅ fixes string vs AttestationConveyancePreference
    authenticatorSelection: opts.authenticatorSelection,
  };

  if (opts.excludeCredentials?.length) {
    out.excludeCredentials = opts.excludeCredentials.map(
      (cred): PublicKeyCredentialDescriptor => ({
        type: "public-key",
        id: typeof cred.id === "string" ? fromB64URL(cred.id) : cred.id,
        transports: coerceTransports(cred.transports), // ✅ fixes string[] vs AuthenticatorTransport[]
      })
    );
  }

  return out;
}

export function decodeGetOptions(
  opts: PublicKeyCredentialRequestOptionsJSON
): PublicKeyCredentialRequestOptions {
  const {
    challenge,
    allowCredentials,
    // the rest of the fields copy over verbatim
    ...rest
  } = opts;

  const out: PublicKeyCredentialRequestOptions = {
    ...rest,
    challenge: fromB64URL(challenge),
  };

  if (allowCredentials && allowCredentials.length) {
    out.allowCredentials = allowCredentials.map((cred): PublicKeyCredentialDescriptor => ({
      type: cred.type,
      id: typeof cred.id === "string" ? fromB64URL(cred.id) : cred.id, // BufferSource
      transports: cred.transports,
    }));
  }
  return out;
}

// ---- Strictly typed serializer ----
export function publicKeyCredentialToJSON(cred: PublicKeyCredential): PublicKeyCredentialJSON {
  // Prefer native serializer if present
  type WithToJSON = PublicKeyCredential & {toJSON?: () => PublicKeyCredentialJSON;};
  const c = cred as WithToJSON;
  
  if (typeof c.toJSON === "function") return c.toJSON();

  const base = {
    id: cred.id,
    type: cred.type as "public-key",
    rawId: toB64url(toUTF8(cred.rawId)),
    clientExtensionResults: cred.getClientExtensionResults(),
  };

  const resp = cred.response;

  if (isAttestation(resp)) {
    const att = resp as AttestationWithTransports;
    return {
      ...base,
      response: {
        clientDataJSON: toB64url(toUTF8(att.clientDataJSON)),
        attestationObject: toB64url(toUTF8(att.attestationObject)),
        transports:
          typeof att.getTransports === "function" ? att.getTransports() : undefined,
      },
    };
  }

  if (isAssertion(resp)) {
    return {
      ...base,
      response: {
        clientDataJSON: toB64url(toUTF8(resp.clientDataJSON)),
        authenticatorData: toB64url(toUTF8(resp.authenticatorData)),
        signature: toB64url(toUTF8(resp.signature)),
        userHandle:
          resp.userHandle === null? null: toB64url(new Uint8Array(resp.userHandle))
      },
    };
  }

  throw new Error("Unsupported PublicKeyCredential response type");
}


export async function loginWithPasskey(): Promise<Response | unknown> {
    // 1) Ask server for *authentication* options (usernameless => no allowCredentials)
          const { options } = await postJSON<{ options: PublicKeyCredentialRequestOptionsJSON }>(
            `${DEFAULT_LOGIN_PASSKEY_API}/options`,{}
          );
  
          console.log(options)
    
          // 2) Decode into native shapes
          const publicKey = decodeGetOptions(options);
    
          // 3) Request assertion (Face/Touch ID dialog)
          const assertion = (await navigator.credentials.get({
            publicKey,
            // Let the browser auto-prompt if possible (safe to include; ignored if unsupported)
            mediation: "optional" as CredentialMediationRequirement,
          })) as PublicKeyCredential | null;
    
          if (!assertion) throw new Error("Authentication was cancelled.");
    
          // 4) Send to server for verification & session issuance (sets httpOnly cookie)
          const authResp = publicKeyCredentialToJSON(assertion);
          let response= await postJSON(`${DEFAULT_LOGIN_PASSKEY_API}/verify`, { authResp });
         
  
         return response
  }




