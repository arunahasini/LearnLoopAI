"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  calculateAllTopicPerformance,
  recommendNextAction,
} from "@/lib/learning/engine";
import { courseTopics, type LearningAttempt } from "@/lib/learning/types";

type ProgressContextValue = {
  attempts: LearningAttempt[];
  ready: boolean;
  demoMode: boolean;
  storageError: string | null;
  performance: ReturnType<typeof calculateAllTopicPerformance>;
  recordAttempt: (attempt: LearningAttempt) => void;
  resetProgress: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);
const storageErrorMessage =
  "Browser storage is unavailable. Your demo progress will not persist after you leave.";

function isLearningAttempt(value: unknown): value is LearningAttempt {
  if (!value || typeof value !== "object") return false;
  const attempt = value as Record<string, unknown>;
  return (
    typeof attempt.id === "string" &&
    typeof attempt.questionId === "string" &&
    courseTopics.some((topic) => topic.id === attempt.topicId) &&
    Number.isInteger(attempt.selectedOption) &&
    typeof attempt.isCorrect === "boolean" &&
    typeof attempt.attemptedAt === "string" &&
    Number.isFinite(Date.parse(attempt.attemptedAt))
  );
}

export function LearningProgressProvider({
  children,
  userId,
  demoMode,
}: {
  children: ReactNode;
  userId: string;
  demoMode: boolean;
}) {
  const storageKey = `learnloop:demo-progress:${userId}`;
  const [attempts, setAttempts] = useState<LearningAttempt[]>([]);
  const attemptsRef = useRef<LearningAttempt[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (demoMode) {
        try {
          const raw = window.localStorage.getItem(storageKey);
          if (raw) {
            const parsed: unknown = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.every(isLearningAttempt)) {
              attemptsRef.current = parsed;
              setAttempts(parsed);
            } else {
              window.localStorage.removeItem(storageKey);
            }
          }
        } catch {
          setStorageError(storageErrorMessage);
        }
        setReady(true);
        return;
      }
      void fetch("/api/learning/progress", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as
              | { error?: string }
              | null;
            throw new Error(
              payload?.error ?? "Saved progress could not be loaded.",
            );
          } else {
            const payload = (await response.json()) as {
              attempts?: unknown;
            };
            if (
              !Array.isArray(payload.attempts) ||
              !payload.attempts.every(isLearningAttempt)
            ) {
              throw new Error("Saved progress has an invalid data format.");
            }
            attemptsRef.current = payload.attempts;
            setAttempts(payload.attempts);
          }
        })
        .catch((error: unknown) => {
          setStorageError(
            error instanceof Error
              ? error.message
              : "Saved progress could not be loaded.",
          );
        })
        .finally(() => setReady(true));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [demoMode, storageKey]);

  const recordAttempt = useCallback(
    (attempt: LearningAttempt) => {
      const current = attemptsRef.current;
      if (current.some((entry) => entry.id === attempt.id)) return;
      const next = [...current, attempt];
      attemptsRef.current = next;
      setAttempts(next);
      if (demoMode) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          setStorageError(storageErrorMessage);
        }
      }
    },
    [demoMode, storageKey],
  );

  const resetProgress = useCallback(() => {
    attemptsRef.current = [];
    setAttempts([]);
    if (!demoMode) {
      void fetch("/api/learning/progress", { method: "DELETE" }).then(
        async (response) => {
          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as
              | { error?: string }
              | null;
            setStorageError(
              payload?.error ?? "Saved progress could not be reset.",
            );
          } else {
            setStorageError(null);
          }
        },
      ).catch(() => setStorageError("Saved progress could not be reset."));
    }
    try {
      if (demoMode) {
        window.localStorage.removeItem(storageKey);
        window.localStorage.removeItem(`learnloop:demo-revision:${userId}`);
        window.localStorage.removeItem(`learnloop:demo-material-tasks:${userId}`);
      }
      window.dispatchEvent(new Event("learnloop:demo-progress-reset"));
      if (demoMode) setStorageError(null);
    } catch {
      setStorageError(storageErrorMessage);
    }
  }, [demoMode, storageKey, userId]);

  const performance = useMemo(
    () => calculateAllTopicPerformance(attempts),
    [attempts],
  );
  const value = useMemo<ProgressContextValue>(
    () => ({
      attempts,
      ready,
      demoMode,
      storageError,
      performance,
      recordAttempt,
      resetProgress,
    }),
    [attempts, demoMode, performance, ready, recordAttempt, resetProgress, storageError],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useLearningProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error(
      "useLearningProgress must be used within LearningProgressProvider.",
    );
  }

  return context;
}

export function getRecommendationForTopic(
  topicId: LearningAttempt["topicId"],
  performance: ReturnType<typeof calculateAllTopicPerformance>,
) {
  const topicPerformance = performance.find((entry) => entry.topicId === topicId);
  if (!topicPerformance) {
    throw new Error(`Missing learning performance for topic "${topicId}".`);
  }

  return recommendNextAction(topicPerformance);
}
