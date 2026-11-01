import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/auth-forms";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Choose a new password | LearnLoop AI",
};
export const instant = false;

export default async function ResetPasswordPage() {
  if (!getSupabaseConfig()) {
    redirect("/login?setup=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?error=callback");
  }

  return (
    <AuthShell>
      <p className="text-sm font-semibold text-indigo-700">ONE LAST STEP</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#101936]">
        Choose a new password
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Use at least 8 characters. You can sign in with it right away.
      </p>
      <UpdatePasswordForm />
    </AuthShell>
  );
}
