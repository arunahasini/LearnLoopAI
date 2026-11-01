import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  Command,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { LearningProgressProvider } from "./progress-provider";
import { ProgressResetButton } from "./progress-reset-button";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/learn", label: "My learning", icon: BookOpen },
  { href: "/quiz", label: "Practice quiz", icon: BrainCircuit },
  { href: "/knowledge-map", label: "Knowledge map", icon: Map },
  { href: "/revision-planner", label: "Revision planner", icon: CalendarDays },
];

export function AppShell({
  children,
  activePath,
  userName,
  userId,
  demoMode,
}: {
  children: ReactNode;
  activePath: string;
  userName: string;
  userId: string;
  demoMode: boolean;
}) {
  return (
    <LearningProgressProvider userId={userId} demoMode={demoMode}>
    <div className="min-h-screen bg-[#f5f6fb] text-[#17213f]">
      <input
        id="mobile-nav-toggle"
        type="checkbox"
        className="peer sr-only"
        aria-label="Toggle navigation"
      />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-slate-200/80 bg-white px-4 py-5 lg:flex">
        <Brand />
        <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </p>
        <nav aria-label="Main navigation" className="space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = activePath === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-50 text-indigo-800"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                {label}
                {label === "Practice quiz" && (
                  <span className="ml-auto rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                    NEW
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#111a38] p-4 text-white">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-semibold">Build your evidence</p>
          <p className="mt-1 text-xs leading-5 text-indigo-100/65">
            Practice a topic to see your attempts and mastery update here.
          </p>
        </div>
        <UserCard userName={userName} demoMode={demoMode} />
        <ProgressResetButton />
      </aside>

      <div className="fixed inset-x-0 top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white px-4 lg:hidden">
        <Brand />
        <label
          htmlFor="mobile-nav-toggle"
          className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-within:ring-2 focus-within:ring-indigo-500"
        >
          <Menu className="peer-checked:hidden" size={20} aria-hidden="true" />
          <span className="sr-only">Open navigation</span>
        </label>
      </div>
      <label
        htmlFor="mobile-nav-toggle"
        aria-label="Close navigation"
        className="fixed inset-0 z-40 hidden cursor-pointer bg-slate-950/30 peer-checked:block lg:hidden"
      />
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[280px] flex-col bg-white px-4 py-5 shadow-xl peer-checked:flex lg:hidden">
        <div className="flex items-center justify-between">
          <Brand />
          <label
            htmlFor="mobile-nav-toggle"
            className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Close navigation</span>
          </label>
        </div>
        <nav aria-label="Mobile navigation" className="mt-8 space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={activePath === href ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                activePath === href
                  ? "bg-indigo-50 text-indigo-800"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <UserCard userName={userName} demoMode={demoMode} />
          <ProgressResetButton />
        </div>
      </aside>

      <div className="min-h-screen pt-[68px] lg:ml-[248px] lg:pt-0">
        <header className="hidden h-[68px] items-center justify-between border-b border-slate-200/80 bg-white px-8 lg:flex xl:px-10">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Command size={15} aria-hidden="true" />
            <span>Learning workspace</span>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-600">
              {navigation.find((item) => item.href === activePath)?.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              {demoMode ? "Local demo · not signed in" : "Supabase saved"}
            </span>
            <div className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-800">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <span className="max-w-32 truncate text-sm font-medium text-slate-700">
              {userName}
            </span>
            <ChevronDown size={15} className="text-slate-400" aria-hidden="true" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
          <div className="mb-5 flex justify-end lg:hidden">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              {demoMode ? "Local demo · not signed in" : "Supabase saved"}
            </span>
          </div>
          {children}
        </main>
      </div>
    </div>
    </LearningProgressProvider>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex w-fit items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl bg-[#111a38] text-white shadow-lg shadow-indigo-950/10">
        <BrainCircuit size={21} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-[#17213f]">
        LearnLoop <span className="text-indigo-600">AI</span>
      </span>
    </Link>
  );
}

function UserCard({
  userName,
  demoMode,
}: {
  userName: string;
  demoMode: boolean;
}) {
  return (
    <div className="mt-4 flex items-center gap-3 border-t border-slate-100 px-2 pt-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-800">
        {userName.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {userName}
        </p>
        <p className="text-xs text-slate-400">Learner</p>
      </div>
      {!demoMode && (
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <LogOut size={17} aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  );
}
