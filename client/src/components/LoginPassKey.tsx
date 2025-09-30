import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {loginWithPasskey} from "@/utilities/passkeys";
import { DEFAULT_LOGIN_PASSKEY_API } from "@/utilities/constants";



type LoginPasskeyProps = {
  /** Base path for auth endpoints, e.g. "/api/login" */
  apiBase?: string;
  /** Optional callback after successful login (otherwise we navigate to /chat) */
  onSuccess?: () => void;
};

export default function LoginPasskey({
 
  onSuccess,
}: LoginPasskeyProps) {
  const [supported, setSupported] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ok = !!(window.PublicKeyCredential && typeof window.PublicKeyCredential === "function");
    setSupported(ok);
  }, []);

  const login = useCallback(async () => {
    setError(null);
    if (!supported || submitting) return;
    
    try {
      setSubmitting(true);
      await loginWithPasskey()
      
      if (onSuccess) onSuccess();
      
      else navigate("/chat", { replace: true });
    } catch (e: any) {
       console.error(e);
       setError(e?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }, [DEFAULT_LOGIN_PASSKEY_API, navigate, onSuccess, supported, submitting]);

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <Card className="backdrop-blur bg-white/70 dark:bg-neutral-900/70">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
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
            onClick={login}
            disabled={!supported || submitting}
            className="w-full inline-flex items-center justify-center gap-2"
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

          <p className="mt-3 text-xs text-neutral-500">
            Tip: if nothing happens, ensure you registered a passkey on this device and you’re on the
            same origin (RP ID) you used for registration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
