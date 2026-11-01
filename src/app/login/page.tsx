import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";
import { safeInternalPath } from "@/lib/auth/validation";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Sign in | LearnLoop AI",
};
export const instant = false;

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const isConfigured = Boolean(getSupabaseConfig());
  const nextPath = safeInternalPath(
    typeof params.next === "string" ? params.next : "/dashboard",
  );

  return (
    <AuthShell>
      <p className="text-sm font-semibold text-indigo-700">WELCOME BACK</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#101936]">
        Sign in to your account
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Continue your learning journey right where you left off.
      </p>

      {!isConfigured && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
        >
          Supabase isn’t configured yet. Sign-in is unavailable until you add
          the required environment variables; no demo login is enabled.
        </p>
      )}
      {params.setup === "missing" && isConfigured && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
        >
          Your session couldn’t be verified. Please sign in again.
        </p>
      )}
      {params.reset === "success" && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
        >
          Your password was updated. Sign in with your new password.
        </p>
      )}
      {params.error === "callback" && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
        >
          That verification or reset link is invalid or has expired. Request a
          new email and try again.
        </p>
      )}
      {params.error === "network" && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
        >
          We couldn’t reach the authentication service. Check your connection
          and try again.
        </p>
      )}
      {params.error === "signout" && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
        >
          We couldn’t end your session. Please try signing out again.
        </p>
      )}
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  );
}
