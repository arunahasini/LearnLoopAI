import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/auth-forms";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Create an account | LearnLoop AI",
};

export default function SignupPage() {
  const isConfigured = Boolean(getSupabaseConfig());

  return (
    <AuthShell>
      <p className="text-sm font-semibold text-indigo-700">YOUR NEXT CHAPTER</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#101936]">
        Create your account
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Set up your account and make your learning journey your own.
      </p>
      {!isConfigured && (
        <p
          role="status"
          className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
        >
          Supabase isn’t configured yet. Account creation is unavailable until
          the required environment variables are added.
        </p>
      )}
      <SignupForm />
    </AuthShell>
  );
}
