"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleDashed,
  LockKeyhole,
} from "lucide-react";
import { useLearningProgress } from "./progress-provider";
import { courseTopics } from "@/lib/learning/types";

export function KnowledgeMapProgress() {
  const { attempts, performance, ready } = useLearningProgress();
  const supported = performance.filter((item) => item.mastery !== null);
  const averageMastery =
    supported.length === 0
      ? null
      : Math.round(
          supported.reduce((sum, item) => sum + (item.mastery ?? 0), 0) /
            supported.length,
        );
  const high = performance.filter((item) => item.status === "high").length;
  const developing = performance.filter(
    (item) => item.status === "developing",
  ).length;
  const needsFoundation = performance.filter(
    (item) => item.status === "low",
  ).length;

  return (
    <>
      <section className="mt-8 grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <div className="relative overflow-hidden rounded-2xl bg-[#111a38] p-6 text-white">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 size-64 rounded-full bg-indigo-500/20 blur-3xl"
          />
          <p className="relative text-xs font-semibold uppercase tracking-wider text-indigo-200">
            Evidence-based overview
          </p>
          <p className="relative mt-5 text-5xl font-semibold tracking-tight">
            {ready && averageMastery !== null ? (
              <>
                {averageMastery}
                <span className="text-2xl text-indigo-200">%</span>
              </>
            ) : (
              <span aria-label="Insufficient evidence">—</span>
            )}
          </p>
          <p className="relative mt-2 text-sm text-indigo-100/65">
            {averageMastery === null
              ? "No topics meet the 3-attempt minimum yet"
              : `Average across ${supported.length} topics with sufficient evidence`}
          </p>
          <div className="relative mt-8 flex flex-wrap gap-2">
            <CountChip label="High" count={high} />
            <CountChip label="Developing" count={developing} />
            <CountChip label="Low" count={needsFoundation} />
          </div>
          <p className="relative mt-8 border-t border-white/10 pt-4 text-xs leading-5 text-indigo-100/50">
            Mastery weights 60% of recent accuracy and 40% of cumulative
            accuracy. A topic stays unestimated until it has 3 attempts.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#17213f]">
                Topic mastery
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Based only on recorded quiz answers
              </p>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Demo progress
            </span>
          </div>
          <div className="mt-7 space-y-4">
            {courseTopics.map((topic, index) => {
              const result = performance.find(
                (item) => item.topicId === topic.id,
              );
              const mastery = result?.mastery ?? null;
              const status =
                !ready || !result || result.status === "insufficient-evidence"
                  ? "Insufficient evidence"
                  : result.status === "high"
                    ? "High mastery"
                    : result.status === "developing"
                      ? "Developing"
                      : "Needs foundations";
              return (
                <div key={topic.id}>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                        result?.status === "high"
                          ? "bg-emerald-50 text-emerald-700"
                          : result?.status === "developing"
                            ? "bg-indigo-50 text-indigo-700"
                            : result?.status === "low"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {result?.status === "high" ? (
                        <Check size={17} aria-hidden="true" />
                      ) : result?.status === "insufficient-evidence" ||
                        !result ? (
                        <LockKeyhole size={15} aria-hidden="true" />
                      ) : (
                        <CircleDashed size={17} aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-[#17213f]">
                          {topic.title}
                        </span>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
                          {mastery === null ? "—" : `${mastery}%`}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div
                          className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
                          role="progressbar"
                          aria-label={`${topic.title} estimated mastery`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={mastery ?? 0}
                          aria-valuetext={
                            mastery === null
                              ? "Insufficient evidence"
                              : `${mastery}%`
                          }
                        >
                          {mastery !== null && (
                            <div
                              className={`h-full rounded-full ${
                                result?.status === "high"
                                  ? "bg-emerald-500"
                                  : result?.status === "developing"
                                    ? "bg-indigo-500"
                                    : "bg-amber-400"
                              }`}
                              style={{ width: `${mastery}%` }}
                            />
                          )}
                        </div>
                        <span className="w-32 text-right text-[10px] text-slate-400">
                          {status}
                          {result?.attempts
                            ? ` · ${result.correct}/${result.attempts}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index < courseTopics.length - 1 && (
                    <div className="ml-[17px] h-3 border-l border-dashed border-slate-200" />
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
            {attempts.length} demo attempts recorded for your signed-in account
            in this browser.
          </p>
        </div>
      </section>

      <section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <h2 className="text-sm font-semibold text-[#17213f]">
            Continue building evidence
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            The adaptive engine uses your attempts to select a suitable next
            question.
          </p>
        </div>
        <Link href="/quiz" className="button-primary w-fit">
          Practice a topic <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}

function CountChip({ label, count }: { label: string; count: number }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-indigo-100">
      {count} {label.toLowerCase()}
    </span>
  );
}
