import type { ReactNode } from "react";
import Link from "next/link";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#101936] px-12 py-10 text-white lg:flex lg:flex-col xl:px-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-1/4 size-[34rem] rounded-full bg-indigo-500/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-blue-400/10 blur-3xl"
        />
        <Link href="/" className="relative flex w-fit items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-[#101936]">
            L
          </span>
          <span className="text-lg font-semibold tracking-tight">
            LearnLoop <span className="text-indigo-300">AI</span>
          </span>
        </Link>

        <div className="relative my-auto max-w-xl py-16">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-medium text-indigo-100">
            <span className="size-1.5 rounded-full bg-indigo-300" />
            YOUR LEARNING, IN A NEW LIGHT
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            A little progress,{" "}
            <span className="text-indigo-300">every day.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-indigo-100/70">
            Pick up where you left off. LearnLoop helps make every next step
            feel like your own.
          </p>

          <div className="relative mt-14 aspect-[1.45] max-w-lg rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-100/55">YOUR LEARNING PATH</p>
                <p className="mt-1 font-medium">Small steps add up</p>
              </div>
              <span className="rounded-full bg-indigo-400/15 px-3 py-1 text-xs text-indigo-100">
                Keep going
              </span>
            </div>
            <div className="mt-7 flex h-[calc(100%-4.5rem)] items-end gap-3">
              <div className="flex h-[42%] flex-1 items-end rounded-t-xl bg-indigo-300/30 p-2">
                <span className="text-[10px] text-white/65">Explore</span>
              </div>
              <div className="flex h-[62%] flex-1 items-end rounded-t-xl bg-blue-300/35 p-2">
                <span className="text-[10px] text-white/65">Practice</span>
              </div>
              <div className="flex h-[78%] flex-1 items-end rounded-t-xl bg-indigo-300/50 p-2">
                <span className="text-[10px] text-white/65">Understand</span>
              </div>
              <div className="flex h-full flex-1 items-end rounded-t-xl bg-gradient-to-t from-indigo-400/60 to-blue-300/45 p-2">
                <span className="text-[10px] text-white/80">Grow</span>
              </div>
            </div>
            <div className="absolute right-10 top-24 size-3 rounded-full bg-white shadow-[0_0_24px_8px_rgba(165,180,252,0.5)]" />
          </div>
          <p className="mt-6 text-xs text-indigo-100/45">
            Learning is a journey. We’ll meet you where you are.
          </p>
        </div>
        <p className="relative text-xs text-indigo-100/45">
          © LearnLoop AI
        </p>
      </aside>

      <section className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-12 xl:px-20">
        <Link href="/" className="flex w-fit items-center gap-2.5 lg:hidden">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#101936] font-bold text-white">
            L
          </span>
          <span className="font-semibold tracking-tight text-[#101936]">
            LearnLoop <span className="text-indigo-600">AI</span>
          </span>
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          {children}
        </div>
        <p className="text-center text-xs text-slate-400">
          Learn at your pace. Come back whenever you’re ready.
        </p>
      </section>
    </main>
  );
}
