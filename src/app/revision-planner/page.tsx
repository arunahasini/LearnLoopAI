import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCheck,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/learning/app-shell";
import { AIStudyPlan } from "@/components/learning/ai-study-plan";
import { RevisionChecklist } from "@/components/learning/revision-checklist";
import { isDemoUser, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Revision planner | LearnLoop AI",
};
export const instant = false;

export default async function RevisionPlannerPage() {
  const user = await requireUser();
  const demoMode = isDemoUser(user);
  const userName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] || "Learner";

  return (
    <AppShell
      activePath="/revision-planner"
      userName={userName}
      userId={user.id}
      demoMode={demoMode}
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-indigo-700">A PLAN THAT FEELS DOABLE</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17213f] sm:text-4xl">
            Revision planner
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Topics are prioritized from your quiz performance. Checklist
            completion is {demoMode ? "saved in this browser only." : "saved to your account."}
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
          {demoMode ? "Local demo planner" : "Saved planner"}
        </span>
      </div>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <CheckCheck size={19} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-[#17213f]">
                  Your focus list
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Small, prioritized sessions for the week
                </p>
              </div>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Evidence-based tasks
            </span>
          </div>
          <div className="mt-6">
            <RevisionChecklist userId={user.id} />
          </div>
          <AIStudyPlan userId={user.id} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              How priorities work
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Sparkles size={18} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#17213f]">
                  Evidence-led planning
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Priorities update as you practice
                </p>
              </div>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              The checklist follows deterministic learning rules. Optional AI
              plans are generated from the same mastery evidence and labeled
              as suggestions.
            </p>
          </div>

          <div className="rounded-2xl bg-[#111a38] p-5 text-white shadow-sm sm:p-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
              <Sparkles size={18} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-semibold">
              Keep it flexible
            </h2>
            <p className="mt-2 text-xs leading-5 text-indigo-100/65">
              Keep the evidence-based checklist or request an optional AI plan
              with a time budget and deadline.
            </p>
            <Link
              href="/quiz"
              className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-white hover:text-indigo-200"
            >
              Start a practice quiz <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
