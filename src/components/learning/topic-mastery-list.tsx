"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLearningProgress } from "./progress-provider";
import { courseTopics } from "@/lib/learning/types";

export function TopicMasteryList({ compact = false }: { compact?: boolean }) {
  const { performance, ready } = useLearningProgress();

  return (
    <div className={compact ? "space-y-[18px]" : "space-y-4"}>
      {courseTopics.map((topic) => {
        const result = performance.find((item) => item.topicId === topic.id);
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
            <div className="mb-2 flex items-center justify-between gap-3">
              <Link
                href="/quiz"
                className="truncate text-xs font-medium text-slate-700 hover:text-indigo-700"
              >
                {topic.title}
              </Link>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
                {mastery === null ? "—" : `${mastery}%`}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label={`${topic.title} estimated mastery`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={mastery ?? 0}
              aria-valuetext={
                mastery === null ? "Insufficient evidence" : `${mastery}%`
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
            {!compact && (
              <p className="mt-1 text-[10px] text-slate-400">
                {status}
                {result && result.attempts > 0
                  ? ` · ${result.correct}/${result.attempts} correct`
                  : ""}
              </p>
            )}
          </div>
        );
      })}
      {!compact && (
        <Link
          href="/knowledge-map"
          className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
        >
          Open knowledge map <ArrowRight size={13} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
