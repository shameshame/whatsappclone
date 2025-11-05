import React, {useEffect,useState } from "react";
import { useNavigate } from "react-router";
import { publicKeyCredentialToJSON,loginWithPasskey,decodeGetOptions,decodeCreateOptions,postJSON } from "../utilities/passkeys";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";

/**
 * CreateAccount.tsx
 *
 * A production-ready, phone-first **Create Account** component using **Passkeys (WebAuthn)**.
 * - Tailwind styling (clean card UI)
 * - Calls your server endpoints:
 *     POST /auth/passkey/register/options  { displayName, handle?, phone? }
 *     POST /auth/passkey/register/verify   { userId, attResp }
 * - On success, sets httpOnly cookies (server responsibility) and triggers onSuccess()
 * - Includes graceful feature detection + helpful errors
 * - Optional phone number (not required for registration)
 *
 * Plug this into your page (Next.js/CRA) and provide an onSuccess callback to redirect to /chat.
 */

// ----------------------
// Component
// ----------------------

type CreateFormValues = { displayName: string; handle?: string; phone?: string };

type CreateAccountProps = {
  apiBase?: string;

};

const DEFAULT_API = "api/registration";

export default function CreateAccount({apiBase = DEFAULT_API,  }: CreateAccountProps){

  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean>(true);
  const navigate = useNavigate()

  useEffect(() => {
    // Feature-detect WebAuthn platform support
    const isSupported = !!(window.PublicKeyCredential && typeof window.PublicKeyCredential === "function");
    setSupported(isSupported);
    
  }, []);

  const form = useForm<CreateFormValues>({
    defaultValues: { displayName: "", handle: "", phone: "" },
    mode: "onChange",
  });

  // If you need all three values in this component:

const [displayName, handle, phone] = useWatch({
  control:form.control,
  name: ["displayName", "handle", "phone"],
}) as [string, string | undefined, string];

  const canSubmit = supported && !submitting && form.formState.isValid;

  const onSubmitRHF: SubmitHandler<CreateFormValues> = async (values) => {
    setError(null);
    if (!canSubmit) return;
    try {
      setSubmitting(true);

      // 1) Ask server for registration options
      const payload = {
        displayName: values.displayName.trim(),
        handle: values.handle?.trim() || undefined,
        phone: values.phone?.trim(),
      };
      const { userId, options } = await postJSON<{ userId: string; options: any }>(
        `${apiBase}/options`,
        payload
      );

      // 2) Convert to proper types for navigator.credentials.create
      const publicKey = decodeCreateOptions(options);

      // 3) Create credential
      const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
      if (!credential) throw new Error("Passkey creation was cancelled.");

      // 4) Send attestation back to server for verification & session issuance
      const attestationResp = publicKeyCredentialToJSON(credential);
      await postJSON(`${apiBase}/verify`, { userId, attResp: attestationResp });

      // Server should set httpOnly cookie; continue
       navigate("/chat",{replace:true})
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // CHANGED: give the page a softer, premium background and ensure reasonable max width
    <div className="w-full max-w-md mx-auto p-4 font-sans
                    bg-[linear-gradient(180deg,#FAFBEA_0%,#F7F9ED_100%)]"> {/* CHANGED */}

      {/* CHANGED: slightly stronger card, clearer border, subtle ring */}
      <div className="bg-white/90 dark:bg-neutral-900/80 backdrop-blur
                      shadow-xl rounded-2xl border border-black/5 dark:border-white/10
                      ring-1 ring-black/5">
        <div className="px-6 pt-6 pb-2">
          {/* CHANGED: bigger title, tighter tracking, darker slate text */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Create your account
          </h1>
          {/* CHANGED: calmer body color */}
          <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">
            Use a <span className="font-semibold">passkey</span> to sign in with Face/Touch ID. No passwords, no SMS.
          </p>
        </div>

        {!supported && (
          // CHANGED: align warning with the rest of your palette
          <div className="mx-6 mb-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
            Your browser doesn’t seem to support Passkeys/WebAuthn. Try the latest Chrome/Safari/Firefox, or install the web app.
          </div>
        )}

        {error && (
          // (kept as-is, looks fine)
          <div className="mx-6 mb-3 rounded-lg border border-red-300 bg-red-50 text-red-900 p-3 text-sm" role="alert">
            {error}
          </div>
        )}

        <Form {...form}>
          {/* CHANGED: add a little more vertical breathing room */}
          <form onSubmit={form.handleSubmit(onSubmitRHF)} className="px-6 pb-7">
            {/* CHANGED: increase control spacing */}
            <div className="space-y-5">
              {/* Display name */}
              <FormField
                control={form.control}
                name="displayName"
                rules={{
                  required: "Please enter your display name.",
                  minLength: { value: 2, message: "Must be at least 2 characters." },
                }}
                render={({ field }) => (
                  <FormItem>
                    {/* CHANGED: use medium weight and slate color */}
                    <FormLabel className="text-slate-800 font-medium">Display name</FormLabel>
                    <FormControl>
                      {/* CHANGED: taller inputs, better placeholder, brand focus ring */}
                      <Input
                        {...field}
                        id="displayName"
                        autoComplete="name"
                        placeholder="e.g., Alex"
                        className="h-11 placeholder:text-slate-400
                                   focus-visible:ring-2 focus-visible:ring-primary
                                   focus-visible:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Handle (optional) */}
              <FormField
                control={form.control}
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-800 font-medium">Handle (optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="handle"
                        placeholder="Choose a unique handle or leave blank"
                        className="h-11 placeholder:text-slate-400
                                   focus-visible:ring-2 focus-visible:ring-primary
                                   focus-visible:border-primary"
                      />
                    </FormControl>
                    {/* CHANGED: slightly lighter helper text */}
                    <p className="mt-1 text-xs text-slate-500">
                      You can claim one later if you skip now.
                    </p>
                  </FormItem>
                )}
              />

              {/* Phone (optional) */}
              <FormField
                control={form.control}
                name="phone"
                rules={{
                  validate: (v) =>
                    !v ||
                    /^\+?[1-9]\d{7,14}$/.test(v) ||
                    "Please enter a valid phone number (E.164).",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-800 font-medium">Phone (optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        placeholder="+972501234567"
                        className="h-11 placeholder:text-slate-400
                                   focus-visible:ring-2 focus-visible:ring-primary
                                   focus-visible:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="mt-1 text-xs text-slate-500">
                      Used later for contact discovery or recovery; not required now.
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* CHANGED: make primary button brand-colored and bolder */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 inline-flex w-full items-center justify-center gap-2
                         h-11 rounded-xl bg-primary text-white font-semibold
                         hover:bg-primary/90 disabled:bg-primary/40 disabled:cursor-not-allowed
                         focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              {submitting ? (
                <>
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating passkey…
                </>
              ) : (
                <>Create with Passkey</>
              )}
            </Button>

            {/* CHANGED: slightly smaller, calmer legal text */}
            <div className="mt-4 text-[11px] text-slate-500">
              By continuing, you agree to our Terms and Privacy Policy.
            </div>
          </form>
        </Form>
      </div>

      {/* CHANGED: tone down footnote + spacing */}
      <p className="text-xs text-slate-500 mt-3 text-center">
        Having trouble? Ensure you’re on <span className="font-medium">https</span> and using a modern browser/PWA. Passkeys need Face/Touch ID enabled.
      </p>
    </div>
  );
}
