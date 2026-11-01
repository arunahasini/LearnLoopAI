import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

export type DemoUser = {
  id: typeof DEMO_USER_ID;
  email: null;
  user_metadata: { full_name: "Demo learner" };
  isDemo: true;
};

export function isDemoUserId(userId: string): boolean {
  return userId === DEMO_USER_ID;
}

export function isDemoUser(
  user: Awaited<ReturnType<typeof requireUser>>,
): user is DemoUser {
  return "isDemo" in user && user.isDemo;
}

export async function requireUser() {
  if (!getSupabaseConfig()) {
    return {
      id: DEMO_USER_ID,
      email: null,
      user_metadata: { full_name: "Demo learner" },
      isDemo: true as const,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?setup=missing");
  }

  return data.user;
}
