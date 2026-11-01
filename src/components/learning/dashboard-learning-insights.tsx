"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleCheck,
  Target,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLearningProgress } from "./progress-provider";
import { TopicMasteryList } from "./topic-mastery-list";
import { courseTopics } from "@/lib/learning/types";
import { recommendNextAction } from "@/lib/learning/engine";

function getSevenDayActivity(
  attempts: ReturnType<typeof useLearningProgress>["attempts"],
) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - offset));
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    const daysAttempts = attempts.filter((attempt) => {
      const attempted = new Date(attempt.attemptedAt);
      const attemptedKey = [
        attempted.getFullYear(),
        String(attempted.getMonth() + 1).padStart(2, "0"),
        String(attempted.getDate()).padStart(2, "0"),
      ].join("-");
      return attemptedKey === dateKey;
    });
    return {
      day: date.toLocaleDateString("en", { weekday: "short" }),
      accuracy:
        daysAttempts.length === 0
          ? null
          : Math.round(
              (daysAttempts.filter((attempt) => attempt.isCorrect).length /
                daysAttempts.length) *
                100,
            ),
      count: daysAttempts.length,
    };
  });
}

function pickRecommendation(
  performance: ReturnType<typeof useLearningProgress>["performance"],
) {
  const priority: Record<string, number> = {
    low: 0,
    "insufficient-evidence": 1,
    developing: 2,
    high: 3,
  };
  const ordered = [...performance].sort(
    (left, right) => priority[left.status] - priority[right.status],
  );
  const selected = ordered[0];
  return {
    topic: courseTopics.find((topic) => topic.id === selected.topicId),
    recommendation: recommendNextAction(selected),
  };
}

export function DashboardLearningInsights() {
  const { attempts, performance, ready, storageError, demoMode } =
    useLearningProgress();
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  const accuracy =
    attempts.length === 0 ? null : Math.round((correct / attempts.length) * 100);
  const topicsWithEvidence = performance.filter(
    (topic) => topic.status !== "insufficient-evidence",
  ).length;
  const activity = getSevenDayActivity(attempts);
  const recentAttempts = activity.reduce((total, day) => total + day.count, 0);
  const next = pickRecommendation(performance);

  return (
    <>
      {storageError && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
        >
          {storageError}
        </p>
      )}
      <section
        aria-label="Learning performance from your quiz attempts"
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          icon={<Target size={18} />}
          label="Quiz attempts"
          value={ready ? String(attempts.length) : "—"}
          note={demoMode ? "Saved in this browser" : "Saved to your account"}
          tone="indigo"
        />
        <MetricCard
          icon={<CircleCheck size={18} />}
          label="Overall accuracy"
          value={accuracy === null ? "—" : `${accuracy}%`}
          note={attempts.length ? `${correct} correct answers` : "No answers yet"}
          tone="green"
        />
        <MetricCard
          icon={<BrainCircuit size={18} />}
          label="Topics with evidence"
          value={ready ? `${topicsWithEvidence} / ${courseTopics.length}` : "—"}
          note="At least 3 attempts per topic"
          tone="blue"
        />
        <MetricCard
          icon={<BookOpen size={18} />}
          label="Last 7 days"
          value={ready ? String(recentAttempts) : "—"}
          note="Quiz attempts"
          tone="orange"
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(22,34,70,.025)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#17213f]">
                Recent accuracy
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Calculated from your attempts · last 7 days
              </p>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                demoMode
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {demoMode ? "Local demo data" : "Supabase-saved data"}
            </span>
          </div>
          {attempts.length === 0 ? (
            <div className="flex h-[248px] flex-col items-center justify-center text-center">
              <ChartNoAxesCombined
                size={25}
                className="text-indigo-300"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-medium text-slate-600">
                Your progress will show here
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Answer a few questions to start building evidence.
              </p>
            </div>
          ) : (
            <div
              className="mt-4 h-[248px] w-full"
              role="img"
              aria-label="Daily accuracy from your quiz attempts over the last seven days"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activity}
                  margin={{ top: 12, right: 12, bottom: 0, left: -18 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#eef0f6"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#98a1b3", fontSize: 11 }}
                    dy={10}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#98a1b3", fontSize: 11 }}
                    tickFormatter={(value: number) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e9ebf2",
                      boxShadow: "0 8px 30px rgba(23,33,63,.08)",
                      fontSize: 12,
                    }}
                    formatter={(value, _name, item) => [
                      value === null ? "No attempts" : `${value}% (${item.payload.count} attempts)`,
                      "Accuracy",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    connectNulls={false}
                    stroke="#6456d8"
                    strokeWidth={3}
                    dot={{
                      r: 3.5,
                      fill: "#fff",
                      strokeWidth: 2,
                      stroke: "#6456d8",
                    }}
                    activeDot={{
                      r: 5,
                      fill: "#6456d8",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(22,34,70,.025)] sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#17213f]">
                Topic mastery
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Evidence-based estimates · 3 attempts minimum
              </p>
            </div>
            <Link
              href="/knowledge-map"
              aria-label="Open full knowledge map"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-700"
            >
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-6">
            <TopicMasteryList compact />
          </div>
        </div>
      </section>

      {next.topic && (
        <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(22,34,70,.025)] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#17213f]">
                  Your next step
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Deterministic guidance from your current topic evidence
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">
                {next.recommendation.status === "insufficient-evidence"
                  ? "START HERE"
                  : next.recommendation.status.toUpperCase()}
              </span>
            </div>
            <div className="mt-5 flex flex-col gap-4 rounded-xl bg-[#f7f8fc] p-4 sm:flex-row sm:items-center">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <BookOpen size={20} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#17213f]">
                  {next.recommendation.title} · {next.topic.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {next.recommendation.explanation}
                </p>
              </div>
              <Link
                href={`/quiz?topic=${next.topic.id}`}
                className="button-secondary w-fit shrink-0"
              >
                {next.recommendation.actionLabel}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-[#111a38] p-6 text-white shadow-[0_10px_32px_rgba(17,26,56,.12)]">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-200">
              Learning engine
            </span>
            <h2 className="mt-5 text-xl font-semibold">One response at a time</h2>
            <p className="mt-2 text-sm leading-6 text-indigo-100/65">
              Mastery combines recent and cumulative quiz accuracy. Estimates
              stay hidden until there are enough attempts.
            </p>
            <Link
              href="/knowledge-map"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-indigo-200"
            >
              Explore topic evidence{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

function MetricCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  tone: "indigo" | "blue" | "orange" | "green";
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(22,34,70,.025)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span
          className={`flex size-9 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-[#17213f]">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </article>
  );
}
