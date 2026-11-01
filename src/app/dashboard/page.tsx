import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit } from "lucide-react";
import { AppShell } from "@/components/learning/app-shell";
import { DashboardLearningInsights } from "@/components/learning/dashboard-learning-insights";
import { isDemoUser, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Dashboard | LearnLoop AI",
};
export const instant = false;

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const params = await searchParams;
  const user = await requireUser();
  const userName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] || "Learner";

  return (
    <AppShell
      activePath="/dashboard"
      userName={userName}
      userId={user.id}
      demoMode={isDemoUser(user)}
    >
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-indigo-700">
            YOUR LEARNING WORKSPACE
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17213f] sm:text-4xl">
            Welcome back, {userName.split(/\s+/)[0]}.
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isDemoUser(user)
              ? "This local demo saves progress in this browser only."
              : "Your quiz progress is saved to your account."}
          </p>
        </div>
        <Link href="/quiz" className="button-primary w-fit">
          <BrainCircuit size={17} aria-hidden="true" />
          Start a quick quiz
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {params.password === "updated" && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Your password was updated successfully.
        </p>
      )}
      {params.error === "signout" && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          We couldn’t end your session. Please try signing out again.
        </p>
      )}

      <DashboardLearningInsights />

      <div className="mt-6 flex justify-end">
        <Link
          href="/revision-planner"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
        >
          Open revision planner <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </AppShell>
  );
}
