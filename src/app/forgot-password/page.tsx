import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Reset your password | LearnLoop AI",
};

export default function ForgotPasswordPage() {
  const isConfigured = Boolean(getSupabaseConfig());

  return (
    <AuthShell>
      <p className="text-sm font-semibold text-indigo-700">ACCOUNT RECOVERY</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#101936]">
        Reset your password
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Enter your account email and we’ll send you a secure reset link.
      </p>
      {!isConfigured && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
        >
          Password recovery is unavailable until Supabase is configured.
        </p>
      )}
      <ForgotPasswordForm />
    </AuthShell>
  );
}
