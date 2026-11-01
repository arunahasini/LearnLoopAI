"use client";

import { useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { courseTopics } from "@/lib/learning/types";
import { useLearningProgress } from "./progress-provider";

type PlanTask = {
  taskId: string;
  topicId: (typeof courseTopics)[number]["id"];
  title: string;
  rationale: string;
  priority: "high" | "medium" | "review";
  durationMinutes: number;
};

type StudyPlan = { tasks: PlanTask[]; notice: string };

async function responseError(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return payload?.error ?? "Could not generate a plan. Please retry.";
}

export function AIStudyPlan({ userId }: { userId: string }) {
  const { performance, ready, demoMode } = useLearningProgress();
  const [minutes, setMinutes] = useState(60);
  const [deadline, setDeadline] = useState("");
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createPlan() {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const response = await fetch("/api/learning/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masteryEvidence: performance.map((item) => ({
            topicId: item.topicId,
            mastery: item.mastery,
            attempts: item.attempts,
            correct: item.correct,
            status: item.status,
          })),
          availableStudyMinutes: minutes,
          ...(deadline ? { deadline } : {}),
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const result = (await response.json()) as StudyPlan;
      setPlan(result);
      if (demoMode) {
        const key = `learnloop:demo-material-tasks:${userId}`;
        const stored = window.localStorage.getItem(key);
        const previous: unknown = stored ? JSON.parse(stored) : [];
        const existing = Array.isArray(previous) ? previous : [];
        const planTasks = result.tasks.map((task) => ({
          taskId: task.taskId,
          topicId: task.topicId,
          title: task.title,
          rationale: task.rationale,
          priority: task.priority,
          completed: false,
        }));
        window.localStorage.setItem(key, JSON.stringify([...existing, ...planTasks]));
        window.dispatchEvent(new Event("learnloop:revision-tasks-updated"));
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not generate a plan. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-white text-indigo-700">
          <Sparkles size={17} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-[#17213f]">
            Generate an AI revision plan
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Suggestions use current {demoMode ? "local demo" : "saved"} mastery
            evidence and remain unverified.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-slate-600">
          Available time (minutes)
          <input
            type="number"
            min={5}
            max={600}
            value={minutes}
            onChange={(event) => setMinutes(Number(event.target.value))}
            className="auth-input mt-1.5 w-40"
            disabled={loading}
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Deadline (optional)
          <input
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className="auth-input mt-1.5 w-44"
            disabled={loading}
          />
        </label>
        <button
          type="button"
          onClick={() => void createPlan()}
          disabled={!ready || loading || minutes < 5 || minutes > 600}
          className="button-primary"
        >
          {loading && (
            <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
          )}
          {loading ? "Planning…" : "Create plan"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800"
        >
          {error}
        </p>
      )}
      {plan && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <ol className="space-y-3">
            {plan.tasks.map((task, index) => (
              <li key={task.topicId} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                  {index + 1}
                </span>
                <span>
                  <strong className="font-semibold text-[#17213f]">
                    {courseTopics.find((topic) => topic.id === task.topicId)?.title}: {task.title}
                  </strong>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {task.rationale} · {task.durationMinutes} min · {task.priority} priority
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">
            {plan.notice}
          </p>
        </div>
      )}
    </section>
  );
}
