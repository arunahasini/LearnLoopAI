"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { useLearningProgress } from "./progress-provider";

export function ProgressResetButton() {
  const { attempts, resetProgress, demoMode } = useLearningProgress();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-3 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-rose-500"
      >
        <RotateCcw size={14} aria-hidden="true" />
        {demoMode ? "Reset local demo progress" : "Reset saved progress"}
      </button>
    );
  }

  return (
    <div
      className="mt-3 rounded-xl border border-rose-100 bg-rose-50 p-3"
      aria-label="Confirm progress reset"
    >
      <p className="text-xs leading-5 text-rose-900">
        Clear {attempts.length} answer{attempts.length === 1 ? "" : "s"} and
        all revision tasks for {demoMode ? "this browser demo" : "your account"}?
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => {
            resetProgress();
            setConfirming(false);
          }}
          className="rounded-lg bg-rose-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
        >
          Clear progress
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-rose-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
