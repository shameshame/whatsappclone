import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {decodeGetOptions,postJSON, publicKeyCredentialToJSON} from "@/utilities/passkeys";
import { PublicKeyCredentialRequestOptionsJSON } from "@/types/credential";
import { DEFAULT_LOGIN_PASSKEY_API } from "@/utilities/constants";
import { bannerFromError } from "@/utilities/banner-map";
import { toAppError } from "@/utilities/error-utils";
import { Banner } from "./Banner";
import { BannerData } from "@/utilities/banner-map";
import { LoginVerifyOK } from "@/types/loginVerifyOk";

type LoginIntent = "default" | "forcePicker";

export default function LoginPasskey() {
  const [supported, setSupported] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerData|null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ok = !!(window.PublicKeyCredential && typeof window.PublicKeyCredential === "function");
    setSupported(ok);
  }, []);

  /** Logs the user in with a discoverable passkey (no handle needed). */
  
  async function loginWithPasskey(intent:LoginIntent) {
  try {
    const { options } = await postJSON<{ options: PublicKeyCredentialRequestOptionsJSON }>(
      `${DEFAULT_LOGIN_PASSKEY_API}/options`,
      {}
    );

    const publicKey = decodeGetOptions(options);

    const assertion = await navigator.credentials.get({
      publicKey,
      mediation: (intent === "forcePicker" ? "required" : "optional") as CredentialMediationRequirement,
    }) as PublicKeyCredential | null;

    if (!assertion) {
      intent==="forcePicker" ? navigate("/register", { replace: true }) : setBanner(bannerFromError({ kind: "webauthn-cancel", message: "" }))
      return;
    }

    const authResp = publicKeyCredentialToJSON(assertion);
    await postJSON<LoginVerifyOK>(`${DEFAULT_LOGIN_PASSKEY_API}/verify`,{ authResp });
    navigate("/phone/chat", { replace: true });
  } catch (error: unknown) {
    const appErr = toAppError(error);
    
    // If force picker was used, be decisive: go register on *any* failure
    if (intent === "forcePicker" && (appErr.kind === "webauthn-cancel" || appErr.kind === "http" || appErr.kind === "network")) {
      return navigate("/register", { replace: true });
    }
    
    setBanner(bannerFromError(appErr));
  }
}

  
const login = useCallback<(intent: LoginIntent) => Promise<void>>(async (intent="default") => {
    setError(null);
    if (!supported || submitting) return;
    
    try {
      setSubmitting(true);
      await loginWithPasskey(intent)

    
    } catch (error: any) {
       console.error(error);
       setError(error?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }, [DEFAULT_LOGIN_PASSKEY_API,supported, submitting]);

  return (
    <div className="w-full max-w-md m-auto p-4">
      <Card className="backdrop-blur bg-white/70 dark:bg-neutral-900/70">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">Sign in</CardTitle>
          {!supported && (
            <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
              Your browser doesn’t support Passkeys/WebAuthn. Try the latest Chrome/Safari/Firefox,
              or install the web app (PWA).
            </div>
          )}
          {error && (
            <div className="mt-2 rounded-lg border border-red-300 bg-red-50 text-red-900 p-3 text-sm">
              {error}
            </div>
          )}
          
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            onClick={() => login("default")}
            disabled={!supported || submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 "
          >
            {submitting ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Signing in…
              </>
            ) : (
              <>Sign in with Passkey</>
            )}
          </Button>

          <Button
            variant="link"
            className="w-auto px-0 mt-1  h-11 text-base text-muted-foreground "
            onClick={()=>login("forcePicker")}
          >
          {/* <Users className="mr-2 h-4 w-4" /> */}
          Use another account
        </Button>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Tip: if nothing happens, ensure you registered a passkey on this device and you’re on the
            same origin (RP ID) you used for registration.
          </p>
        </CardContent>
      </Card>
      {banner && (<Banner message={banner.msg} variant={banner.variant} onClose={() => setBanner(null)} 
                   action={
                    <Button size="sm" onClick={() => navigate("/register")}>
                                    Create account
                    </Button>
                   }
                  className="my-3"
                  />
      )}
    </div>
  );
}
