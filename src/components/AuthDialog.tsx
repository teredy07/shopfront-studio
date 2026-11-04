import * as DialogPrimitive from "@radix-ui/react-dialog";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  completePasswordResetFn,
  logInAccountFn,
  resendEmailCodeFn,
  signUpAccountFn,
  startPasswordResetFn,
  verifyEmailCodeFn,
  verifyPasswordResetCodeFn,
  type AccountUser,
  type EmailAuthChallenge,
} from "@/lib/auth.functions";
import { EASE_OUT_EXPO } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type AuthMode = "login" | "signup" | "reset" | "new-password";

type Step = "login" | "signup" | "reset" | "verify-email" | "verify-reset" | "new-password";
type Notice = { tone: "info" | "error"; text: string };

type Props = {
  mode: AuthMode | null;
  onModeChange: (mode: AuthMode | null) => void;
  onAuthenticated: (user: AccountUser) => void;
};

const inputClassName =
  "w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15";
const linkButtonClassName = "font-semibold text-gold hover:underline disabled:opacity-50";

function getStep(mode: AuthMode, challenge: EmailAuthChallenge | null): Step {
  if (mode === "new-password") return "new-password";
  if (challenge?.purpose === "password-reset") return "verify-reset";
  if (challenge) return "verify-email";
  return mode;
}

function getCopy(step: Step, email = "your email") {
  switch (step) {
    case "new-password":
      return {
        title: "Choose a new password",
        description: `Set a new password for ${email}. Enter it twice to confirm.`,
        submit: "Save new password",
      };
    case "verify-reset":
      return {
        title: "Verify your reset code",
        description: `Enter the 6-digit reset code sent to ${email}. After verification, you'll set a new password.`,
        submit: "Verify reset code",
      };
    case "verify-email":
      return {
        title: "Check your inbox",
        description: `Enter the 6-digit code sent to ${email}. It expires in 10 minutes.`,
        submit: "Verify email",
      };
    case "reset":
      return {
        title: "Reset your password",
        description: "Enter your email and we'll send a reset code if an account matches.",
        submit: "Send reset code",
      };
    case "login":
      return {
        title: "Welcome back",
        description: "Log in to your Cashvibe account. We'll email you a verification code.",
        submit: "Log in",
      };
    case "signup":
      return {
        title: "Create your account",
        description: "Sign up for a Cashvibe account. We'll email you a verification code.",
        submit: "Create account",
      };
  }
}

function getProgress(step: Step) {
  const resetFlow: Step[] = ["reset", "verify-reset", "new-password"];
  if (resetFlow.includes(step)) return { total: 3, current: resetFlow.indexOf(step) };
  return { total: 2, current: step === "verify-email" ? 1 : 0 };
}

/**
 * Account dialog for sign up, log in (both confirmed with an emailed code) and password reset.
 * The parent remounts it (via `key`) each time it opens, so every visit starts fresh.
 */
export function AuthDialog({ mode, onModeChange, onAuthenticated }: Props) {
  // Keep rendering the last step while the dialog animates closed.
  const [shownMode, setShownMode] = useState<AuthMode>(mode ?? "login");
  if (mode && mode !== shownMode) setShownMode(mode);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailChallenge, setEmailChallenge] = useState<EmailAuthChallenge | null>(null);
  const [resetGrant, setResetGrant] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [codeAttempt, setCodeAttempt] = useState(0);
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null),
  );
  const formRef = useRef<HTMLFormElement>(null);
  const reduceMotion = useReducedMotion();

  const step = getStep(shownMode, emailChallenge);
  const copy = getCopy(step, emailChallenge?.email);
  const progress = getProgress(step);

  useEffect(() => {
    if (!emailChallenge) {
      setResendSeconds(0);
      return;
    }
    const updateCountdown = () =>
      setResendSeconds(
        Math.max(0, Math.ceil((emailChallenge.resendAvailableAt - Date.now()) / 1000)),
      );
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [emailChallenge]);

  function switchMode(next: AuthMode) {
    setNotice(null);
    setEmailChallenge(null);
    setResetGrant(null);
    onModeChange(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const code = String(formData.get("verificationCode") ?? "").trim();
    setBusy(true);
    setNotice(null);
    try {
      if (shownMode === "new-password" && resetGrant) {
        const newPassword = String(formData.get("newPassword") ?? "");
        const confirmedPassword = String(formData.get("confirmPassword") ?? "");
        if (newPassword !== confirmedPassword) {
          throw new Error("The passwords don't match. Check both fields and try again.");
        }
        await completePasswordResetFn({ data: { grantId: resetGrant, password: newPassword } });
        setEmailChallenge(null);
        setResetGrant(null);
        onModeChange("login");
        setNotice({
          tone: "info",
          text: "Your password has been reset. Log in with your new password.",
        });
      } else if (emailChallenge?.purpose === "password-reset") {
        const grant = await verifyPasswordResetCodeFn({
          data: { challengeId: emailChallenge.challengeId, code },
        });
        setResetGrant(grant.grantId);
        onModeChange("new-password");
        setNotice({ tone: "info", text: "Code verified. Choose and confirm your new password." });
      } else if (emailChallenge) {
        const user = await verifyEmailCodeFn({
          data: { challengeId: emailChallenge.challengeId, code },
        });
        onAuthenticated(user);
        onModeChange(null);
        toast.success(
          emailChallenge.purpose === "signup"
            ? "Welcome to Cashvibe — your account is ready."
            : "You're logged in.",
        );
      } else if (shownMode === "reset") {
        const challenge = await startPasswordResetFn({ data: { email } });
        setEmailChallenge(challenge);
        setNotice({
          tone: "info",
          text: `If an account exists for ${challenge.email}, a reset code has been sent.`,
        });
      } else if (shownMode === "signup") {
        const challenge = await signUpAccountFn({
          data: { name: String(formData.get("name") ?? "").trim(), email, password },
        });
        setEmailChallenge(challenge);
        setNotice({
          tone: "info",
          text: `We sent a 6-digit verification code to ${challenge.email}.`,
        });
      } else {
        const challenge = await logInAccountFn({ data: { email, password } });
        setEmailChallenge(challenge);
        setNotice({
          tone: "info",
          text: `We sent a 6-digit verification code to ${challenge.email}.`,
        });
      }
    } catch (error) {
      // A rejected code clears the boxes and puts the cursor back in the first one.
      if (step === "verify-email" || step === "verify-reset") setCodeAttempt((count) => count + 1);
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to complete account request. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleResendEmailCode() {
    if (!emailChallenge) return;
    setBusy(true);
    setNotice(null);
    try {
      const challenge = await resendEmailCodeFn({
        data: { challengeId: emailChallenge.challengeId },
      });
      setEmailChallenge(challenge);
      setNotice({
        tone: "info",
        text:
          challenge.purpose === "password-reset"
            ? `If an account exists for ${challenge.email}, a new reset code has been sent.`
            : `A new verification code was sent to ${challenge.email}.`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not resend the verification code.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogPrimitive.Root
      open={mode !== null}
      onOpenChange={(open) => {
        if (!open && !busy) onModeChange(null);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md duration-300 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0">
          <DialogPrimitive.Content
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              opener?.focus({ preventScroll: true });
            }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-7 outline-none shadow-[0_40px_120px_-40px_oklch(0_0_0/0.9)] duration-300 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 sm:p-9"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -top-28 h-56 bg-[radial-gradient(closest-side,oklch(0.7388_0.1297_82.9/0.22),transparent)]"
            />
            <DialogPrimitive.Close
              aria-label="Close"
              disabled={busy}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <X size={18} />
            </DialogPrimitive.Close>

            <div className="relative">
              <div className="flex items-center gap-3">
                <p className="eyebrow">CASHVIBE ACCOUNT</p>
                <StepDots total={progress.total} current={progress.current} />
              </div>

              <motion.div
                key={step}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              >
                <DialogPrimitive.Title className="mt-2 font-display text-3xl font-extrabold text-foreground">
                  {copy.title}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
                  {copy.description}
                </DialogPrimitive.Description>

                <form
                  key={`${shownMode}-${emailChallenge?.purpose ?? "credentials"}`}
                  ref={formRef}
                  autoComplete="off"
                  className="mt-7 space-y-4"
                  onSubmit={handleSubmit}
                >
                  {step === "new-password" ? (
                    <>
                      <Field label="New password" icon={Lock}>
                        <PasswordInput
                          name="newPassword"
                          autoComplete="new-password"
                          minLength={8}
                          maxLength={128}
                          required
                          autoFocus
                          placeholder="At least 8 characters"
                        />
                      </Field>
                      <Field label="Confirm new password" icon={Lock}>
                        <PasswordInput
                          name="confirmPassword"
                          autoComplete="new-password"
                          minLength={8}
                          maxLength={128}
                          required
                          placeholder="Enter the new password again"
                        />
                      </Field>
                    </>
                  ) : step === "verify-email" || step === "verify-reset" ? (
                    <div>
                      <label
                        htmlFor="auth-code"
                        className="block text-sm font-semibold text-foreground"
                      >
                        {step === "verify-reset" ? "Reset code" : "Verification code"}
                      </label>
                      <CodeInput
                        key={codeAttempt}
                        id="auth-code"
                        disabled={busy}
                        onComplete={() => window.setTimeout(() => formRef.current?.requestSubmit())}
                      />
                    </div>
                  ) : (
                    <>
                      {step === "signup" && (
                        <Field label="Name" icon={UserRound}>
                          <input
                            name="name"
                            autoComplete="name"
                            required
                            autoFocus
                            className={inputClassName}
                            placeholder="Your name"
                          />
                        </Field>
                      )}
                      <Field label="Email" icon={Mail}>
                        <input
                          type="email"
                          name="email"
                          autoComplete="email"
                          required
                          autoFocus={step !== "signup"}
                          className={inputClassName}
                          placeholder="you@example.com"
                        />
                      </Field>
                      {step !== "reset" && (
                        <Field label="Password" icon={Lock}>
                          <PasswordInput
                            name="password"
                            autoComplete={step === "login" ? "current-password" : "new-password"}
                            minLength={8}
                            maxLength={128}
                            required
                            placeholder="At least 8 characters"
                          />
                        </Field>
                      )}
                      {step === "login" && (
                        <div className="-mt-2 text-right">
                          <button
                            type="button"
                            disabled={busy}
                            className={cn(linkButtonClassName, "text-sm")}
                            onClick={() => switchMode("reset")}
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  <button type="submit" disabled={busy} className="btn-primary w-full py-3.5">
                    {busy ? (
                      <>
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                        Please wait…
                      </>
                    ) : (
                      copy.submit
                    )}
                  </button>
                </form>
              </motion.div>

              {emailChallenge && step !== "new-password" && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                  <button
                    type="button"
                    disabled={busy || resendSeconds > 0}
                    className={cn(linkButtonClassName, "tabular-nums disabled:cursor-not-allowed")}
                    onClick={handleResendEmailCode}
                  >
                    {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    disabled={busy}
                    className={linkButtonClassName}
                    onClick={() => {
                      setEmailChallenge(null);
                      setNotice(null);
                    }}
                  >
                    {emailChallenge.purpose === "password-reset"
                      ? "Change email"
                      : "Change details"}
                  </button>
                </div>
              )}

              {notice && (
                <motion.p
                  key={notice.text}
                  role={notice.tone === "error" ? "alert" : "status"}
                  initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-sm text-foreground/90",
                    notice.tone === "error"
                      ? "border-destructive/40 bg-destructive/10"
                      : "border-primary/25 bg-primary/10",
                  )}
                >
                  {notice.tone === "error" ? (
                    <AlertCircle
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                    />
                  ) : (
                    <MailCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  )}
                  <span>{notice.text}</span>
                </motion.p>
              )}

              {!emailChallenge && step !== "reset" && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {step === "login" ? "New to Cashvibe?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    disabled={busy}
                    className={cn(linkButtonClassName, "font-bold")}
                    onClick={() => switchMode(step === "login" ? "signup" : "login")}
                  >
                    {step === "login" ? "Sign up" : "Log in"}
                  </button>
                </p>
              )}
              {!emailChallenge && step === "reset" && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Remembered your password?{" "}
                  <button
                    type="button"
                    disabled={busy}
                    className={cn(linkButtonClassName, "font-bold")}
                    onClick={() => switchMode("login")}
                  >
                    Log in
                  </button>
                </p>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="sr-only">
        Step {current + 1} of {total}
      </span>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn(
            "h-1.5 rounded-full transition-all duration-500",
            index === current
              ? "w-5 bg-primary"
              : index < current
                ? "w-1.5 bg-primary/60"
                : "w-1.5 bg-border",
          )}
        />
      ))}
    </span>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-foreground">
      {label}
      <span className="group relative mt-2 flex items-center">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-4 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-gold"
        />
        {children}
      </span>
    </label>
  );
}

function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className">) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(inputClassName, "pr-12")}
      />
      <button
        type="button"
        aria-label="Show password"
        aria-pressed={visible}
        // Keep focus (and the caret) in the field while toggling.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-1.5 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Eye aria-hidden="true" className="h-4 w-4" />
        )}
      </button>
    </>
  );
}

function CodeInput({
  id,
  disabled,
  onComplete,
}: {
  id: string;
  disabled: boolean;
  onComplete: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <InputOTP
      id={id}
      name="verificationCode"
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS}
      inputMode="numeric"
      // Deliberately "off": stops browsers offering the account email for this field.
      autoComplete="off"
      autoFocus
      required
      disabled={disabled}
      value={value}
      onChange={setValue}
      // Codes copied from an email can carry spaces or tabs; keep only the digits.
      pasteTransformer={(pasted) => pasted.replace(/\D/g, "")}
      onComplete={onComplete}
      containerClassName="mt-2 justify-center"
    >
      <InputOTPGroup className="gap-2 sm:gap-2.5">
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className="h-14 w-11 rounded-xl border border-border bg-background font-mono text-2xl font-semibold text-foreground shadow-none first:rounded-xl first:border-l last:rounded-xl data-[active=true]:border-primary data-[active=true]:ring-4 data-[active=true]:ring-primary/15 sm:h-16 sm:w-12"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
