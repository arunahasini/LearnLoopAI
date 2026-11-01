"use server";

import { redirect } from "next/navigation";
import {
  getPublicAuthError,
  isValidEmail,
  isValidPassword,
  readFormString,
  readFormValue,
  safeInternalPath,
  type AuthActionState,
} from "@/lib/auth/validation";
import { getAuthSiteUrl, getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readFormString(formData, "email").toLowerCase();
  const password = readFormValue(formData, "password");
  const nextPath = safeInternalPath(readFormString(formData, "next"));

  if (!isValidEmail(email) || password.length === 0) {
    return { error: "Enter a valid email address and your password." };
  }

  if (!getSupabaseConfig()) {
    return {
      error:
        "Authentication isn’t set up yet. Add the Supabase environment variables to enable sign-in.",
    };
  }

  let error: { message: string } | null;
  try {
    const supabase = await createSupabaseServerClient();
    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  } catch (error) {
    return { error: getPublicAuthError(error) };
  }

  if (error) {
    return {
      error:
        "We couldn’t sign you in with those details. Check your email and password, and make sure your email is verified.",
    };
  }

  redirect(nextPath);
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = readFormString(formData, "fullName");
  const email = readFormString(formData, "email").toLowerCase();
  const password = readFormValue(formData, "password");
  const confirmPassword = readFormValue(formData, "confirmPassword");
  const acceptedTerms = formData.get("terms") === "on";

  if (fullName.length < 2 || fullName.length > 100) {
    return { error: "Enter your full name (2–100 characters)." };
  }
  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!isValidPassword(password)) {
    return { error: "Use a password between 8 and 72 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Your passwords don’t match." };
  }
  if (!acceptedTerms) {
    return { error: "Please agree to the Terms and Privacy Policy to continue." };
  }

  if (!getSupabaseConfig()) {
    return {
      error:
        "Authentication isn’t set up yet. Add the Supabase environment variables to enable account creation.",
    };
  }

  const siteUrl = getAuthSiteUrl();
  if (!siteUrl) {
    return {
      error:
        "Set NEXT_PUBLIC_SITE_URL to your deployed site URL before enabling email verification.",
    };
  }

  let result;
  try {
    const supabase = await createSupabaseServerClient();
    result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL("/auth/callback?next=%2Fdashboard", siteUrl)
          .toString(),
        data: { full_name: fullName },
      },
    });
  } catch (error) {
    return { error: getPublicAuthError(error) };
  }

  if (result.error) {
    return {
      error:
        "We couldn’t create your account. Check your details and try again, or use the sign-in page if you already registered.",
    };
  }

  if (result.data.session) {
    redirect("/dashboard");
  }

  return {
    success:
      "Your account is ready. Check your inbox for a verification link before signing in.",
  };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readFormString(formData, "email").toLowerCase();
  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." };
  }

  if (!getSupabaseConfig()) {
    return {
      error:
        "Password recovery isn’t available until Supabase is configured.",
    };
  }

  const siteUrl = getAuthSiteUrl();
  if (!siteUrl) {
    return {
      error:
        "Set NEXT_PUBLIC_SITE_URL to your deployed site URL before enabling password recovery.",
    };
  }

  let error: { message: string } | null;
  try {
    const supabase = await createSupabaseServerClient();
    ({ error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: new URL(
        "/auth/callback?next=%2Freset-password",
        siteUrl,
      ).toString(),
    }));
  } catch (error) {
    return { error: getPublicAuthError(error) };
  }

  if (error) {
    return { error: getPublicAuthError(error) };
  }

  return {
    success:
      "If an account exists for that email, a password reset link is on its way.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = readFormValue(formData, "password");
  const confirmPassword = readFormValue(formData, "confirmPassword");

  if (!isValidPassword(password)) {
    return { error: "Use a password between 8 and 72 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Your passwords don’t match." };
  }

  if (!getSupabaseConfig()) {
    return {
      error: "Password updates aren’t available until Supabase is configured.",
    };
  }

  let error: { message: string } | null;
  try {
    const supabase = await createSupabaseServerClient();
    ({ error } = await supabase.auth.updateUser({ password }));
  } catch (error) {
    return { error: getPublicAuthError(error) };
  }

  if (error) {
    return {
      error:
        "Your reset link may have expired. Request a new password reset link and try again.",
    };
  }

  redirect("/dashboard?password=updated");
}

export async function logoutAction(): Promise<void> {
  if (!getSupabaseConfig()) {
    redirect("/login?setup=missing");
  }

  let failed = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    failed = Boolean(error);
  } catch {
    failed = true;
  }

  if (failed) {
    redirect("/dashboard?error=signout");
  }

  redirect("/login");
}
