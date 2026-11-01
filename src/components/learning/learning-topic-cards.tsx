"use client";

import Link from "next/link";
import {
  ArrowRight,
  Brackets,
  Hash,
  Layers3,
  Link2,
  TreePine,
} from "lucide-react";
import { useLearningProgress } from "./progress-provider";
import { courseTopics } from "@/lib/learning/types";

const topicIcons = [Brackets, Link2, Layers3, Hash, TreePine];

export function LearningTopicCards() {
  const { performance, ready } = useLearningProgress();

  return (
    <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {courseTopics.map((topic, index) => {
        const Icon = topicIcons[index];
        const result = performance.find((item) => item.topicId === topic.id);
        const mastery = result?.mastery ?? null;
        const status =
          mastery === null
            ? "Insufficient evidence"
            : result?.status === "high"
              ? "High mastery"
              : result?.status === "developing"
                ? "Developing"
                : "Needs foundations";
        return (
          <article
            key={topic.id}
            className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_rgba(22,34,70,.025)] transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_12px_35px_rgba(38,48,93,.07)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                {ready ? status : "Loading progress"}
              </span>
            </div>
            <h3 className="mt-5 text-base font-semibold text-[#17213f]">
              {topic.title}
            </h3>
            <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">
              {topic.description}
            </p>
            <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
              <span>3 practice questions</span>
              <span className="font-semibold text-slate-600">
                {mastery === null ? "— mastery" : `${mastery}% mastery`}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
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
            <p className="mt-2 text-[10px] text-slate-400">
              {result?.attempts ?? 0} attempts
              {result?.attempts
                ? ` · ${result.correct}/${result.attempts} correct`
                : ""}
            </p>
            <Link
              href={`/quiz?topic=${topic.id}`}
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Practice topic
              <ArrowRight
                size={14}
                className="transition group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </article>
        );
      })}
    </section>
  );
}
