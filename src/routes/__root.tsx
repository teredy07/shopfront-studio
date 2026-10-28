import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import {
  getCurrentAccountFn,
  logInAccountFn,
  logOutAccountFn,
  resendEmailCodeFn,
  signUpAccountFn,
  updateAvatarFn,
  verifyEmailCodeFn,
  type AccountUser,
  type EmailAuthChallenge,
} from "../lib/auth.functions";
import { Star, X } from "lucide-react";
import { toast } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Syne:wght@600;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [emailChallenge, setEmailChallenge] = useState<EmailAuthChallenge | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [authUser, setAuthUser] = useState<AccountUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!emailChallenge) {
      setResendSeconds(0);
      return;
    }
    const updateCountdown = () => setResendSeconds(Math.max(0, Math.ceil((emailChallenge.resendAvailableAt - Date.now()) / 1000)));
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [emailChallenge]);

  useEffect(() => {
    let active = true;
    getCurrentAccountFn()
      .then((user) => {
        if (active) setAuthUser(user);
      })
      .catch((error: unknown) => {
        if (active) setAuthMessage(error instanceof Error ? error.message : "Could not reach the account database.");
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function openAuth(mode: "login" | "signup") {
    setAuthMessage("");
    setEmailChallenge(null);
    setAuthMode(mode);
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    setAuthBusy(true);
    setAuthMessage("");
    try {
      if (emailChallenge) {
        const user = await verifyEmailCodeFn({ data: { challengeId: emailChallenge.challengeId, code: String(formData.get("code") ?? "").trim() } });
        setAuthUser(user);
        setAuthMode(null);
        setEmailChallenge(null);
      } else if (authMode === "signup") {
        const challenge = await signUpAccountFn({
          data: {
            name: String(formData.get("name") ?? "").trim(),
            email,
            password,
          },
        });
        setEmailChallenge(challenge);
        setAuthMessage(`We sent a 6-digit verification code to ${challenge.email}.`);
      } else {
        const challenge = await logInAccountFn({ data: { email, password } });
        setEmailChallenge(challenge);
        setAuthMessage(`We sent a 6-digit verification code to ${challenge.email}.`);
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Unable to complete account request. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleResendEmailCode() {
    if (!emailChallenge) return;
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const challenge = await resendEmailCodeFn({ data: { challengeId: emailChallenge.challengeId } });
      setEmailChallenge(challenge);
      setAuthMessage(`A new verification code was sent to ${challenge.email}.`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Could not resend the verification code.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    setAuthBusy(true);
    try {
      await logOutAccountFn();
      setAuthUser(null);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Unable to log out. Please try again.");
      openAuth("login");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!authUser) {
      toast.error("Log in before changing your profile photo.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile photos must be 5 MB or smaller.");
      return;
    }

    setAvatarBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare the profile photo.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      const user = await updateAvatarFn({ data: { dataUrl } });
      setAuthUser(user);
      toast.success("Profile photo updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your profile photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="brand-shine inline-flex items-center gap-1 font-display text-2xl font-extrabold text-foreground">
          ca<span className="text-gold">$</span>hvibe
          <Star aria-hidden="true" className="ml-1 h-3.5 w-3.5 animate-pulse fill-gold text-gold drop-shadow-[0_0_5px_var(--gold)]" />
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden text-sm text-muted-foreground sm:inline">After Effects templates</span>
          {authLoading ? (
            <span className="text-sm text-muted-foreground" aria-label="Restoring account session">Loading account…</span>
          ) : authUser ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex min-w-0 items-center gap-2">
                {authUser.avatarDataUrl ? (
                  <img src={authUser.avatarDataUrl} alt="" className="h-9 w-9 shrink-0 rounded-full border border-primary/50 object-cover" />
                ) : (
                  <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/50 bg-card text-sm font-bold text-gold">
                    {(authUser.fullName || authUser.email || "C").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="hidden min-w-0 sm:block">
                  <span className="block max-w-40 truncate text-sm text-muted-foreground">{authUser.fullName || authUser.email}</span>
                  <button type="button" disabled={avatarBusy} className="text-xs font-semibold text-gold transition hover:underline disabled:opacity-60" onClick={() => avatarInputRef.current?.click()}>
                    {avatarBusy ? "Saving photo…" : "Change photo"}
                  </button>
                </div>
                <button type="button" aria-label="Change profile photo" title="Change profile photo" disabled={avatarBusy} className="rounded-full p-2 text-xs font-semibold text-gold transition hover:bg-card disabled:opacity-60 sm:hidden" onClick={() => avatarInputRef.current?.click()}>
                  {avatarBusy ? "…" : "Edit"}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose profile photo" onChange={handleAvatarChange} />
              </div>
              <button type="button" disabled={authBusy} className="text-sm font-semibold text-foreground transition hover:text-gold disabled:opacity-60" onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <>
              <button type="button" className="text-sm font-semibold text-foreground transition hover:text-gold" onClick={() => openAuth("login")}>
                Log in
              </button>
              <button type="button" className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90" onClick={() => openAuth("signup")}>
                Sign up
              </button>
            </>
          )}
        </div>
      </header>
      <Outlet />
      <Toaster />
      {authMode && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget && !authBusy) { setAuthMode(null); setEmailChallenge(null); } }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-2xl sm:p-9">
            <button type="button" aria-label="Close" disabled={authBusy} className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50" onClick={() => { setAuthMode(null); setEmailChallenge(null); }}>
              <X size={18} />
            </button>
            <p className="eyebrow">CASHVIBE ACCOUNT</p>
            <h2 id="auth-title" className="mt-2 font-display text-3xl font-extrabold text-foreground">
              {emailChallenge ? "Check your inbox" : authMode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {emailChallenge
                ? `Enter the 6-digit code sent to ${emailChallenge.email}. It expires in 10 minutes.`
                : authMode === "login" ? "Log in to your Cashvibe account. We'll email you a verification code." : "Sign up for a Cashvibe account. We'll email you a verification code."}
            </p>
            <form className="mt-7 space-y-4" onSubmit={handleAuthSubmit}>
              {emailChallenge ? (
                <label className="block text-sm font-semibold text-foreground">
                  Verification code
                  <input name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary" placeholder="000000" />
                </label>
              ) : (
                <>
                  {authMode === "signup" && (
                    <label className="block text-sm font-semibold text-foreground">
                      Name
                      <input name="name" autoComplete="name" required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary" placeholder="Your name" />
                    </label>
                  )}
                  <label className="block text-sm font-semibold text-foreground">
                    Email
                    <input type="email" name="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary" placeholder="you@example.com" />
                  </label>
                  <label className="block text-sm font-semibold text-foreground">
                    Password
                    <input type="password" name="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} minLength={8} required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary" placeholder="At least 8 characters" />
                  </label>
                </>
              )}
              <button type="submit" disabled={authBusy} className="w-full rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60">
                {authBusy ? "Please wait…" : emailChallenge ? "Verify email" : authMode === "login" ? "Log in" : "Create account"}
              </button>
            </form>
            {emailChallenge && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                <button type="button" disabled={authBusy || resendSeconds > 0} className="font-semibold text-gold hover:underline disabled:cursor-not-allowed disabled:opacity-50" onClick={handleResendEmailCode}>
                  {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
                </button>
                <span aria-hidden="true">·</span>
                <button type="button" disabled={authBusy} className="font-semibold text-gold hover:underline disabled:opacity-50" onClick={() => { setEmailChallenge(null); setAuthMessage(""); }}>
                  Change details
                </button>
              </div>
            )}
            {authMessage && <p role="status" className="mt-4 rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground">{authMessage}</p>}
            {!emailChallenge && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {authMode === "login" ? "New to Cashvibe?" : "Already have an account?"}{" "}
                <button type="button" disabled={authBusy} className="font-bold text-gold hover:underline disabled:opacity-50" onClick={() => { setAuthMessage(""); setEmailChallenge(null); setAuthMode(authMode === "login" ? "signup" : "login"); }}>
                  {authMode === "login" ? "Sign up" : "Log in"}
                </button>
              </p>
            )}
          </section>
        </div>
      )}
    </QueryClientProvider>
  );
}
