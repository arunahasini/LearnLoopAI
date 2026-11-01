import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brackets } from "lucide-react";
import { AppShell } from "@/components/learning/app-shell";
import { LearningTopicCards } from "@/components/learning/learning-topic-cards";
import { isDemoUser, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "My learning | LearnLoop AI",
};
export const instant = false;

export default async function LearnPage() {
  const user = await requireUser();
  const userName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] || "Learner";

  return (
    <AppShell
      activePath="/learn"
      userName={userName}
      userId={user.id}
      demoMode={isDemoUser(user)}
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-medium text-indigo-700">YOUR COURSE</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17213f] sm:text-4xl">
            Data Structures
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Explore arrays, linked lists, stacks, queues, and trees. Topic
            mastery is estimated only from your submitted practice answers.
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
          Sample course
        </span>
      </div>

      <section className="mt-8 grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            <Brackets size={23} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              COURSE OVERVIEW
            </p>
            <p className="mt-1 text-sm font-semibold text-[#17213f]">
              5 topics <span className="text-slate-300">·</span> 15 practice
              questions <span className="text-slate-300">·</span> Easy to hard
            </p>
          </div>
        </div>
        <Link href="/quiz" className="button-primary w-fit">
          Start adaptive practice <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#17213f]">Course topics</h2>
        <p className="text-xs text-slate-400">
          Progress uses a minimum of 3 attempts per topic
        </p>
      </div>
      <LearningTopicCards />
    </AppShell>
  );
}
