import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleHelp,
  Compass,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "LearnLoop AI | Find your next step",
  description:
    "A thoughtful learning workspace for finding knowledge gaps, practicing concepts, and planning your next study session.",
};

const features = [
  {
    icon: Compass,
    title: "Find your next step",
    description:
      "See what you already understand and where a little more practice could help.",
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    icon: CircleHelp,
    title: "Learn from the why",
    description:
      "Practice questions are designed to reveal the thinking behind your answer.",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Make progress visible",
    description:
      "Bring your topic progress and revision priorities together in one place.",
    color: "bg-emerald-50 text-emerald-700",
  },
];

export default function Home() {
  const authConfigured = Boolean(getSupabaseConfig());
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfbfe] text-[#17213f]">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#111a38] text-white">
            <BrainCircuit size={21} aria-hidden="true" />
          </span>
          <span className="text-base font-bold tracking-tight">
            LearnLoop <span className="text-indigo-600">AI</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-3">
          {authConfigured && (
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              Sign in
            </Link>
          )}
          <Link
            href={authConfigured ? "/signup" : "/dashboard"}
            className="button-primary !min-h-10 !px-4"
          >
            {authConfigured ? "Get started" : "Explore demo"}{" "}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[1fr_0.95fr] lg:px-10 lg:pb-32 lg:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-48 top-16 size-[34rem] rounded-full bg-indigo-100/60 blur-3xl"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-2 text-xs font-semibold text-indigo-800 shadow-sm">
            <Sparkles size={14} aria-hidden="true" />
            Your learning, with a clearer next step
          </p>
          <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#111a38] sm:text-6xl lg:text-[4.25rem]">
            Understand more.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              Keep moving.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            A calm, focused space to explore what you know, spot what needs
            practice, and plan a learning path that makes sense to you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={authConfigured ? "/signup" : "/dashboard"}
              className="button-primary !min-h-12 !px-5"
            >
              {authConfigured ? "Get started" : "Explore local demo"}{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            {authConfigured && (
              <Link
                href="/login"
                className="button-secondary !min-h-12 !px-5"
              >
                I have an account
              </Link>
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" aria-hidden="true" />
              Private learning space
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers3 size={14} className="text-indigo-600" aria-hidden="true" />
              Built around your topics
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div
            aria-hidden="true"
            className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-indigo-100/70 via-transparent to-blue-100/60 blur-2xl"
          />
          <div className="relative rounded-[2rem] border border-white/90 bg-white p-5 shadow-[0_28px_100px_rgba(38,48,93,.13)] sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">
                  DATA STRUCTURES COURSE
                </p>
                <p className="mt-1 text-base font-semibold text-[#17213f]">
                  A guided path through core ideas
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-800">
                5 topics
              </span>
            </div>
            <div className="mt-6 rounded-2xl bg-[#111a38] p-5 text-white sm:p-6">
              <p className="text-xs text-indigo-100/60">YOUR LEARNING LOOP</p>
              <p className="mt-2 text-lg font-semibold">
                Understand → Practice → Reflect
              </p>
              <p className="mt-2 text-xs leading-5 text-indigo-100/60">
                Each answer helps choose a sensible next practice step.
              </p>
              <div className="mt-5 flex items-center gap-2">
                {[0, 1, 2].map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 flex-1 rounded-full ${
                      step === 1 ? "bg-indigo-300" : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                "Arrays",
                "Linked Lists",
                "Stacks & Queues",
                "Trees",
              ].map((label) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-[#fcfcfe] p-3.5"
                >
                  <span className="size-2 rounded-full bg-indigo-400" />
                  <span className="truncate text-[11px] font-medium text-slate-600">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-700">
                <ChartNoAxesCombined size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#17213f]">
                  Evidence before estimates
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  Topic mastery needs enough practice answers
                </p>
              </div>
            </div>
          </div>
          <p className="relative mt-4 text-center text-[11px] text-slate-400">
            Sample course preview · No fabricated mastery values
          </p>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
              A more thoughtful way to study
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111a38] sm:text-4xl">
              Less guessing. More understanding.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-100 bg-[#fcfcfe] p-6 transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_12px_35px_rgba(38,48,93,.06)]"
              >
                <span className={`flex size-11 items-center justify-center rounded-xl ${color}`}>
                  <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-[#17213f]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 rounded-3xl bg-[#111a38] px-6 py-9 text-white sm:px-10 sm:py-12 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">
              One step at a time
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Make your next study session count.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100/65">
              Create your account to enter your personal learning workspace.
            </p>
          </div>
          <Link
            href={authConfigured ? "/signup" : "/dashboard"}
            className="button-primary !min-h-12 !bg-white !text-[#17213f] hover:!bg-indigo-50"
          >
            {authConfigured ? "Get started" : "Explore local demo"}{" "}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <footer className="border-t border-slate-100 bg-white px-5 py-6 text-center text-xs text-slate-400">
        LearnLoop AI · A clearer next step in your learning journey
      </footer>
    </main>
  );
}
