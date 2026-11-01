"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, RotateCcw } from "lucide-react";
import { useLearningProgress } from "./progress-provider";
import { recommendNextAction } from "@/lib/learning/engine";
import { courseTopics } from "@/lib/learning/types";

type RevisionTask = {
  id: string;
  topicId: (typeof courseTopics)[number]["id"];
  title: string;
  reason: string;
  priority: "High" | "Medium" | "Review";
  duration: string;
};

export function RevisionChecklist({ userId }: { userId: string }) {
  const storageKey = `learnloop:demo-revision:${userId}`;
  const { attempts, performance, ready, demoMode } = useLearningProgress();
  const [completed, setCompleted] = useState<string[]>([]);
  const [customTasks, setCustomTasks] = useState<RevisionTask[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");

  const tasks = useMemo<RevisionTask[]>(
    () => {
      const adaptiveTasks = performance
        .map((topicPerformance) => {
          const topic = courseTopics.find(
            (item) => item.id === topicPerformance.topicId,
          );
          if (!topic) return null;
          const recommendation = recommendNextAction(topicPerformance);
          const priority =
            topicPerformance.status === "low"
              ? "High"
              : topicPerformance.status === "high"
                ? "Review"
                : "Medium";
          const reason =
            topicPerformance.status === "insufficient-evidence"
              ? "Begin with foundations; there is not enough evidence yet."
              : `${topicPerformance.correct} of ${topicPerformance.attempts} answers correct across this topic.`;
          return {
            id: `revision-${topic.id}`,
            topicId: topic.id,
            title: recommendation.actionLabel,
            reason,
            priority,
            duration: "Short practice",
          };
        })
        .filter((task): task is RevisionTask => task !== null)
        .sort((left, right) => {
          const order = { High: 0, Medium: 1, Review: 2 };
          return order[left.priority] - order[right.priority];
        });
      return [...adaptiveTasks, ...customTasks];
    },
    [customTasks, performance],
  );

  useEffect(() => {
    if (!ready) return;

    const frame = window.requestAnimationFrame(() => {
      if (!demoMode) {
        void fetch("/api/learning/revision-tasks", { cache: "no-store" })
          .then(async (response) => {
            if (!response.ok) {
              const payload = (await response.json().catch(() => null)) as
                | { error?: string }
                | null;
              throw new Error(payload?.error ?? "Saved tasks could not be loaded.");
            }
            const payload = (await response.json()) as {
              tasks?: Array<{
                taskId: string;
                topicId: RevisionTask["topicId"];
                title: string;
                rationale: string;
                priority: "high" | "medium" | "review";
                completed: boolean;
              }>;
            };
            if (!Array.isArray(payload.tasks)) {
              throw new Error("Saved tasks have an invalid data format.");
            }
            setCompleted(
              payload.tasks
                .filter((task) => task.completed)
                .map((task) => task.taskId),
            );
            setCustomTasks(
              payload.tasks
                .filter(
                  (task) =>
                    task.taskId.startsWith("material-") ||
                    task.taskId.startsWith("plan-"),
                )
                .map((task) => ({
                  id: task.taskId,
                  topicId: task.topicId,
                  title: task.title,
                  reason: task.rationale,
                  priority:
                    task.priority === "high"
                      ? "High"
                      : task.priority === "review"
                        ? "Review"
                        : "Medium",
                  duration: "Short practice",
                })),
            );
          })
          .catch((error: unknown) =>
            setStorageWarning(
              error instanceof Error
                ? error.message
                : "Saved revision tasks could not be loaded.",
            ),
          )
          .finally(() => setHydrated(true));
        return;
      }
      try {
        const stored = window.localStorage.getItem(storageKey);
        const storedMaterials = window.localStorage.getItem(
          `learnloop:demo-material-tasks:${userId}`,
        );
        if (storedMaterials) {
          const parsedMaterials: unknown = JSON.parse(storedMaterials);
          if (
            Array.isArray(parsedMaterials) &&
            parsedMaterials.every(
              (item) =>
                item &&
                typeof item === "object" &&
                typeof item.taskId === "string" &&
                typeof item.topicId === "string" &&
                courseTopics.some((topic) => topic.id === item.topicId) &&
                typeof item.title === "string" &&
                typeof item.rationale === "string" &&
                (item.priority === undefined ||
                  item.priority === "high" ||
                  item.priority === "medium" ||
                  item.priority === "review") &&
                typeof item.completed === "boolean",
            )
          ) {
            setCustomTasks(
              parsedMaterials.map((item) => ({
                id: item.taskId,
                topicId: item.topicId,
                title: item.title,
                reason: item.rationale,
                priority:
                  item.priority === "high"
                    ? ("High" as const)
                    : item.priority === "review"
                      ? ("Review" as const)
                      : ("Medium" as const),
                duration: "Short practice",
              })),
            );
            setCompleted((current) => [
              ...new Set([
                ...current,
                ...parsedMaterials
                  .filter((item) => item.completed)
                  .map((item) => item.taskId),
              ]),
            ]);
          } else {
            window.localStorage.removeItem(
              `learnloop:demo-material-tasks:${userId}`,
            );
          }
        }
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (
            Array.isArray(parsed) &&
            parsed.length <= 30 &&
            parsed.every(
              (item) => typeof item === "string" && item.length <= 120,
            )
          ) {
            setCompleted(parsed);
          } else {
            window.localStorage.removeItem(storageKey);
          }
        }
      } catch {
        setStorageWarning(
          "Browser storage is unavailable; checklist changes won’t persist after you leave.",
        );
      }
      setHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [ready, storageKey, demoMode, userId]);

  useEffect(() => {
    const clearChecklist = () => {
      setCompleted([]);
      setCustomTasks([]);
    };
    const refreshDemoTasks = () => {
      try {
        const stored = window.localStorage.getItem(
          `learnloop:demo-material-tasks:${userId}`,
        );
        if (!stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (
          !Array.isArray(parsed) ||
          !parsed.every(
            (item) =>
              item &&
              typeof item === "object" &&
              typeof item.taskId === "string" &&
              typeof item.topicId === "string" &&
              courseTopics.some((topic) => topic.id === item.topicId) &&
              typeof item.title === "string" &&
              typeof item.rationale === "string" &&
              ["high", "medium", "review"].includes(item.priority) &&
              typeof item.completed === "boolean",
          )
        ) {
          throw new Error("Saved revision tasks have an invalid format.");
        }
        setCustomTasks(
          parsed.map((item) => ({
            id: item.taskId,
            topicId: item.topicId,
            title: item.title,
            reason: item.rationale,
            priority:
              item.priority === "high"
                ? ("High" as const)
                : item.priority === "review"
                  ? ("Review" as const)
                  : ("Medium" as const),
            duration: "Short practice",
          })),
        );
      } catch (error) {
        setStorageWarning(
          error instanceof Error
            ? error.message
            : "Saved revision tasks could not be loaded.",
        );
      }
    };
    window.addEventListener("learnloop:demo-progress-reset", clearChecklist);
    window.addEventListener("learnloop:revision-tasks-updated", refreshDemoTasks);
    return () => {
      window.removeEventListener(
        "learnloop:demo-progress-reset",
        clearChecklist,
      );
      window.removeEventListener(
        "learnloop:revision-tasks-updated",
        refreshDemoTasks,
      );
    };
  }, [userId]);

  function toggleTask(id: string) {
    const next = completed.includes(id)
      ? completed.filter((taskId) => taskId !== id)
      : [...completed, id];
    setCompleted(next);
    void saveTasks(next);
  }

  function resetTasks() {
    setCompleted([]);
    void saveTasks([]);
  }

  async function saveTasks(completedIds: string[]) {
    if (demoMode) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(completedIds));
        window.localStorage.setItem(
          `learnloop:demo-material-tasks:${userId}`,
          JSON.stringify(
            customTasks.map((task) => ({
              taskId: task.id,
              topicId: task.topicId,
              title: task.title,
              rationale: task.reason,
              priority:
                task.priority === "High"
                  ? "high"
                  : task.priority === "Review"
                    ? "review"
                    : "medium",
              completed: completedIds.includes(task.id),
            })),
          ),
        );
      } catch {
        setStorageWarning(
          "Browser storage is unavailable; checklist changes won’t persist after you leave.",
        );
      }
      return;
    }
    try {
      const response = await fetch("/api/learning/revision-tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.map((task) => ({
            taskId: task.id,
            topicId: task.topicId,
            title: task.title,
            rationale: task.reason,
            priority:
              task.priority === "High"
                ? "high"
                : task.priority === "Review"
                  ? "review"
                  : "medium",
            completed: completedIds.includes(task.id),
          })),
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Checklist changes could not be saved.");
      }
      setStorageWarning("");
    } catch (error) {
      setStorageWarning(
        error instanceof Error
          ? error.message
          : "Checklist changes could not be saved.",
      );
    }
  }

  return (
    <div>
      {storageWarning && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900"
        >
          {storageWarning}
        </p>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500" aria-live="polite">
          {hydrated ? completed.length : 0} of {tasks.length} tasks done
        </p>
        <button
          type="button"
          onClick={resetTasks}
          disabled={completed.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-white hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reset checklist
        </button>
      </div>
      {!ready || tasks.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
          There are no study topics to schedule yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task, index) => {
            const isDone = completed.includes(task.id);
            return (
              <li key={task.id}>
                <div
                  className={`flex items-start gap-4 rounded-2xl border p-4 transition sm:items-center ${
                    isDone
                      ? "border-emerald-100 bg-emerald-50/60"
                      : "border-slate-200 bg-white hover:border-indigo-200"
                  }`}
                >
                  <input
                    id={task.id}
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleTask(task.id)}
                    aria-label={`${isDone ? "Mark incomplete" : "Complete"} ${task.title} for ${courseTopics.find((topic) => topic.id === task.topicId)?.title}`}
                    className="size-5 shrink-0 accent-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={task.id}
                      className={`block cursor-pointer text-sm font-semibold ${
                        isDone
                          ? "text-slate-400 line-through"
                          : "text-[#17213f]"
                      }`}
                    >
                      {task.title}
                    </label>
                    <p className="mt-1 text-xs text-slate-500">
                      {courseTopics.find((topic) => topic.id === task.topicId)?.title}{" "}
                      · {task.reason}
                    </p>
                  </div>
                  <span className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        task.priority === "High"
                          ? "bg-rose-50 text-rose-700"
                          : task.priority === "Review"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock3 size={12} aria-hidden="true" />
                      {task.duration}
                    </span>
                    <span className="sr-only">Task {index + 1}</span>
                  </span>
                  <Link
                    href={`/quiz?topic=${task.topicId}`}
                    aria-label={`Practice ${courseTopics.find((topic) => topic.id === task.topicId)?.title}`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
                  >
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-slate-400">
        Based on {attempts.length} answers.{" "}
        {demoMode
          ? "Checklist marks are saved only in this browser."
          : "Checklist marks are saved to your account."}
      </p>
    </div>
  );
}
