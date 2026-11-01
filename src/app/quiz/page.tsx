import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/learning/app-shell";
import { AIPractice } from "@/components/learning/ai-practice";
import { QuizPlayer } from "@/components/learning/quiz-player";
import { isDemoUser, requireUser } from "@/lib/auth/require-user";
import { courseTopics, type TopicId } from "@/lib/learning/types";

export const metadata: Metadata = {
  title: "Practice quiz | LearnLoop AI",
};
export const instant = false;

export default async function QuizPage({
  searchParams,
}: PageProps<"/quiz">) {
  const params = await searchParams;
  const user = await requireUser();
  const userName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] || "Learner";
  const requestedTopic =
    typeof params.topic === "string" &&
    courseTopics.some((topic) => topic.id === params.topic)
      ? (params.topic as TopicId)
      : undefined;

  return (
    <AppShell
      activePath="/quiz"
      userName={userName}
      userId={user.id}
      demoMode={isDemoUser(user)}
    >
      <Link
        href="/learn"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-700"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to learning
      </Link>
      <div className="mx-auto mt-7 max-w-3xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <BrainCircuit size={22} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Adaptive practice
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-[#17213f]">
              Data Structures assessment
            </h1>
          </div>
        </div>
        <p className="mb-6 text-sm leading-6 text-slate-500">
          Answer topic-specific questions, review explanations, and see
          difficulty adapt to your evidence. Attempts and mastery stay in this
          browser as demo progress; answers are checked on the server.
        </p>
        <QuizPlayer initialTopic={requestedTopic} />
        <AIPractice initialTopic={requestedTopic} userId={user.id} />
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400">
          <ShieldAlert
            size={14}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          The adaptive assessment remains curated. Optional AI practice is
          clearly labeled and does not change the deterministic mastery rules.
        </p>
      </div>
    </AppShell>
  );
}
