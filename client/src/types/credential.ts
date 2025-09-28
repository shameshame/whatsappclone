type Base64URLString = string;

export type PublicKeyCredentialHints = "security-key" | "client-device" | "hybrid";

// ---------- typed JSON shape from your API ----------
export interface PublicKeyCredentialRequestOptionsJSON {
  challenge: Base64URLString;
  timeout?: number;
  rpId?: string;
  userVerification?: UserVerificationRequirement;
  hints?: PublicKeyCredentialHints[];
  extensions?: AuthenticationExtensionsClientInputs;
  allowCredentials?: Array<{
    type: "public-key";
    id: Base64URLString | ArrayBuffer;           // server may already send bytes in some impls
    transports?: AuthenticatorTransport[];
  }>;
}

// ---------- JSON shape your server returns for *registration* ----------
export interface PublicKeyCredentialCreationOptionsJSON {
  challenge: Base64URLString;
  rp: PublicKeyCredentialRpEntity;
  user: {
    id: Base64URLString | BufferSource;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  excludeCredentials?: Array<{
    type: "public-key";
    id: Base64URLString | BufferSource;
    transports?: AuthenticatorTransport[];
  }>;
  hints?: PublicKeyCredentialHints[]; // optional, experimental
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface AttestationCredentialJSON {
  id: string;
  type: "public-key";
  rawId: Base64URLString;
  response: {
    clientDataJSON: Base64URLString;
    attestationObject: Base64URLString;
    transports?: AuthenticatorTransport[];
  };
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
}

export interface AssertionCredentialJSON {
  id: string;
  type: "public-key";
  rawId: Base64URLString;
  response: {
    clientDataJSON: Base64URLString;
    authenticatorData: Base64URLString;
    signature: Base64URLString;
    userHandle: Base64URLString | null;
  };
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
}

export type PublicKeyCredentialJSON =
  | AttestationCredentialJSON
  | AssertionCredentialJSON;