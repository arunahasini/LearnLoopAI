"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  initialAuthActionState,
  type AuthActionState,
} from "@/lib/auth/validation";
import {
  loginAction,
  requestPasswordResetAction,
  signupAction,
  updatePasswordAction,
} from "@/app/auth/actions";

function AuthFeedback({ state }: { state: AuthActionState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        aria-live="assertive"
        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
      >
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
      >
        {state.success}
      </p>
    );
  }

  return null;
}

function PasswordField({
  id,
  label,
  autoComplete,
  required = true,
  minLength,
  onValueChange,
}: {
  id: string;
  label: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
  onValueChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={72}
          onChange={(event) => onValueChange?.(event.target.value)}
          className="auth-input pr-16"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 rounded-r-xl px-4 text-xs font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-indigo-600"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

function SubmitButton({
  pending,
  idleText,
  pendingText,
}: {
  pending: boolean;
  idleText: string;
  pendingText: string;
}) {
  return (
    <button type="submit" disabled={pending} className="auth-submit">
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {pendingText}
        </>
      ) : (
        idleText
      )}
    </button>
  );
}

export function LoginForm({
  nextPath,
}: {
  nextPath: string;
}) {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={nextPath} />
      <AuthFeedback state={state} />
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          className="auth-input"
          placeholder="you@example.com"
        />
      </div>
      <PasswordField
        id="password"
        label="Password"
        autoComplete="current-password"
      />
      <div className="-mt-1 flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-indigo-700 underline-offset-4 hover:text-indigo-900 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <SubmitButton
        pending={pending}
        idleText="Sign in"
        pendingText="Signing in…"
      />
      <p className="text-center text-sm text-slate-600">
        New to LearnLoop?{" "}
        <Link
          href="/signup"
          className="font-semibold text-indigo-700 underline-offset-4 hover:text-indigo-900 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(
    signupAction,
    initialAuthActionState,
  );
  const [password, setPassword] = useState("");
  const strength = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
  const strengthLabel =
    password.length === 0
      ? "Use at least 8 characters"
      : ["Add more variety", "Getting there", "Good", "Strong"][strength - 1] ??
        "Use at least 8 characters";

  return (
    <form action={formAction} className="mt-7 space-y-4">
      <AuthFeedback state={state} />
      <div>
        <label
          htmlFor="fullName"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          maxLength={100}
          required
          className="auth-input"
          placeholder="Your name"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          className="auth-input"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          minLength={8}
          onValueChange={setPassword}
        />
        <div className="mt-2" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-1 flex-1 rounded-full ${
                  strength >= step ? "bg-indigo-500" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Password strength: {strengthLabel}
          </p>
        </div>
      </div>
      <PasswordField
        id="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        minLength={8}
      />
      <label className="flex items-start gap-2.5 pt-1 text-sm leading-5 text-slate-600">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-0.5 size-4 shrink-0 rounded border-slate-300 accent-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        />
        <span>
          I agree to the LearnLoop AI Terms and Privacy Policy.
        </span>
      </label>
      <SubmitButton
        pending={pending}
        idleText="Create account"
        pendingText="Creating account…"
      />
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-indigo-700 underline-offset-4 hover:text-indigo-900 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <AuthFeedback state={state} />
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          className="auth-input"
          placeholder="you@example.com"
        />
      </div>
      <SubmitButton
        pending={pending}
        idleText="Send reset link"
        pendingText="Sending link…"
      />
      <p className="text-center text-sm text-slate-600">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-indigo-700 underline-offset-4 hover:text-indigo-900 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <AuthFeedback state={state} />
      <PasswordField
        id="password"
        label="New password"
        autoComplete="new-password"
        minLength={8}
      />
      <PasswordField
        id="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        minLength={8}
      />
      <SubmitButton
        pending={pending}
        idleText="Update password"
        pendingText="Updating password…"
      />
    </form>
  );
}
