"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  getNextQuestionAction,
  submitAnswerAction,
} from "@/app/learning/actions";
import { useLearningProgress } from "./progress-provider";
import { getRecommendationForTopic } from "./progress-provider";
import {
  courseTopics,
  type Difficulty,
  type LearningAttempt,
  type PublicQuestion,
  type QuizFeedback as Feedback,
  type TopicId,
} from "@/lib/learning/types";

const SESSION_QUESTION_LIMIT = 5;

export function QuizPlayer({ initialTopic }: { initialTopic?: TopicId }) {
  const [selectedTopic, setSelectedTopic] = useState<TopicId>(
    initialTopic ?? courseTopics[0].id,
  );
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [seenQuestionIds, setSeenQuestionIds] = useState<string[]>([]);
  const [sessionAttempts, setSessionAttempts] = useState<LearningAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionInFlight = useRef(false);
  const { attempts, performance, ready, recordAttempt, storageError } =
    useLearningProgress();
  const recommendation = getRecommendationForTopic(selectedTopic, performance);
  const finished = sessionAttempts.length >= SESSION_QUESTION_LIMIT;

  async function loadQuestion(
    topicId: TopicId,
    difficulty: Difficulty,
    excludedIds: string[],
  ) {
    setLoading(true);
    setError(null);
    setFeedback(null);
    setSelectedOption(null);
    try {
      const result = await getNextQuestionAction(topicId, difficulty, excludedIds);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setQuestion(result.data);
      setSeenQuestionIds((current) =>
        current.includes(result.data.id) ? current : [...current, result.data.id],
      );
      submissionInFlight.current = false;
    } catch {
      setError("We couldn’t load a practice question. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function startPractice() {
    setQuestion(null);
    setSeenQuestionIds([]);
    setSessionAttempts([]);
    setSelectedOption(null);
    setFeedback(null);
    void loadQuestion(selectedTopic, recommendation.difficulty, []);
  }

  function chooseTopic(value: string) {
    const topic = courseTopics.find((item) => item.id === value);
    if (!topic) return;
    const nextTopic = topic.id;
    setSelectedTopic(nextTopic);
    setQuestion(null);
    setSelectedOption(null);
    setFeedback(null);
    setSeenQuestionIds([]);
    setSessionAttempts([]);
    setError(null);
  }

  async function submitAnswer() {
    if (
      !question ||
      selectedOption === null ||
      feedback ||
      submissionInFlight.current
    ) {
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitAnswerAction(question.id, selectedOption);
      if (!result.success) {
        setError(result.error);
        submissionInFlight.current = false;
        return;
      }

      setFeedback(result.data);
      setSessionAttempts((current) => [...current, result.data.attempt]);
      recordAttempt(result.data.attempt);
    } catch {
      setError("We couldn’t check that answer. Please try again.");
      submissionInFlight.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  function loadNextQuestion() {
    const nextRecommendation = getRecommendationForTopic(
      selectedTopic,
      performance,
    );
    const excluded =
      question?.totalQuestions != null &&
      seenQuestionIds.length >= question.totalQuestions
        ? []
        : seenQuestionIds;
    void loadQuestion(selectedTopic, nextRecommendation.difficulty, excluded);
  }

  const sessionCorrect = sessionAttempts.filter(
    (attempt) => attempt.isCorrect,
  ).length;

  if (!ready) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-500">Loading your demo progress…</p>
      </section>
    );
  }

  if (!question) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        {finished ? (
          <div className="py-3 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <Check size={27} aria-hidden="true" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Practice session complete
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[#17213f]">
              {sessionCorrect} of {sessionAttempts.length} correct
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              Your answers have updated topic performance and the next-step
              guidance below. Demo progress is stored in this browser.
            </p>
            <div className="mx-auto mt-6 max-w-lg rounded-2xl bg-indigo-50 p-4 text-left">
              <p className="text-sm font-semibold text-indigo-950">
                {recommendation.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-indigo-900/75">
                {recommendation.explanation}
              </p>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={startPractice}
                disabled={loading}
                className="button-primary"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Practice this topic again
              </button>
              <Link href="/knowledge-map" className="button-secondary">
                View topic mastery <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <Sparkles size={21} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  Adaptive practice
                </p>
                <h2 className="mt-0.5 text-xl font-semibold text-[#17213f]">
                  Choose a topic
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Question difficulty follows the deterministic mastery estimate.
              When evidence is limited, practice starts with a foundation-level
              question.
            </p>
            <label
              htmlFor="quiz-topic"
              className="mb-2 mt-6 block text-sm font-medium text-slate-700"
            >
              Data Structures topic
            </label>
            <select
              id="quiz-topic"
              value={selectedTopic}
              onChange={(event) => chooseTopic(event.target.value)}
              className="auth-input"
            >
              {courseTopics.map((topic) => {
                const topicPerformance = performance.find(
                  (item) => item.topicId === topic.id,
                );
                return (
                  <option key={topic.id} value={topic.id}>
                    {topic.title} ·{" "}
                    {topicPerformance?.mastery === null ||
                    topicPerformance?.mastery === undefined
                      ? "insufficient evidence"
                      : `${topicPerformance.mastery}% estimated mastery`}
                  </option>
                );
              })}
            </select>
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
              <p className="text-sm font-semibold text-indigo-950">
                {recommendation.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-indigo-900/75">
                {recommendation.explanation}
              </p>
            </div>
            {error && <ErrorMessage message={error} />}
            {storageError && <ErrorMessage message={storageError} />}
            <button
              type="button"
              onClick={startPractice}
              disabled={loading}
              className="button-primary mt-6"
            >
              {loading ? "Loading question…" : recommendation.actionLabel}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <p className="mt-4 text-xs text-slate-400">
              {attempts.filter((attempt) => attempt.topicId === selectedTopic).length}{" "}
              saved demo attempts for this topic
            </p>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            {question.topicName} · {question.difficulty}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Session question {sessionAttempts.length + (feedback ? 0 : 1)} of{" "}
            {SESSION_QUESTION_LIMIT}
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
          Server-checked practice
        </span>
      </div>
      <div
        className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Practice session progress"
        aria-valuemin={0}
        aria-valuemax={SESSION_QUESTION_LIMIT}
        aria-valuenow={sessionAttempts.length}
      >
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{
            width: `${(sessionAttempts.length / SESSION_QUESTION_LIMIT) * 100}%`,
          }}
        />
      </div>
      <h2 className="mt-8 max-w-2xl text-2xl font-semibold leading-snug tracking-tight text-[#17213f] sm:text-3xl">
        {question.text}
      </h2>
      <fieldset className="mt-7 space-y-3" disabled={Boolean(feedback) || submitting}>
        <legend className="sr-only">Choose one answer</legend>
        {question.options.map((option, index) => {
          const selected = selectedOption === index;
          const isCorrectAnswer = feedback?.correctOption === index;
          const selectedIncorrect = feedback && selected && !feedback.isCorrect;
          return (
            <label
              key={option}
              className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 text-left text-sm transition focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
                isCorrectAnswer
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                  : selectedIncorrect
                    ? "border-rose-300 bg-rose-50 text-rose-950"
                    : selected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-950"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-slate-50"
              } ${feedback || submitting ? "cursor-default" : ""}`}
            >
              <input
                type="radio"
                name="quiz-answer"
                value={index}
                checked={selected}
                onChange={() => setSelectedOption(index)}
                className="size-4 accent-indigo-600"
              />
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  isCorrectAnswer
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : selectedIncorrect
                      ? "border-rose-500 bg-rose-500 text-white"
                      : selected
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {String.fromCharCode(65 + index)}
              </span>
              {option}
            </label>
          );
        })}
      </fieldset>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-5 rounded-xl border px-4 py-4 text-sm leading-6 ${
            feedback.isCorrect
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-100 bg-rose-50/70 text-slate-700"
          }`}
        >
          <p
            className={`font-semibold ${
              feedback.isCorrect ? "text-emerald-900" : "text-rose-900"
            }`}
          >
            {feedback.isCorrect ? "Correct." : "Not quite."}
          </p>
          <p className="mt-1">{feedback.explanation}</p>
          {!feedback.isCorrect && feedback.misconception && (
            <p className="mt-2 text-xs leading-5 text-rose-900">
              <span className="font-semibold">Possible misconception:</span>{" "}
              {feedback.misconception.explanation}
            </p>
          )}
          {!feedback.isCorrect && feedback.possibleMisunderstanding && (
            <p className="mt-2 text-xs leading-5 text-rose-900">
              <span className="font-semibold">
                Possible misunderstanding:
              </span>{" "}
              {feedback.possibleMisunderstanding}
            </p>
          )}
        </div>
      )}
      {feedback && (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
          <p className="text-sm font-semibold text-indigo-950">
            Next: {recommendation.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-indigo-900/75">
            {recommendation.explanation}
          </p>
        </div>
      )}
      {error && <ErrorMessage message={error} />}
      {storageError && <ErrorMessage message={storageError} />}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Exit practice
        </Link>
        {!feedback ? (
          <button
            type="button"
            disabled={selectedOption === null || submitting}
            onClick={() => void submitAnswer()}
            className="button-primary disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? "Checking answer…" : "Check answer"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : finished ? (
          <button
            type="button"
            onClick={() => {
              setQuestion(null);
              setFeedback(null);
              setSelectedOption(null);
            }}
            className="button-primary"
          >
            See session results <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={loadNextQuestion}
            className="button-primary disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Choosing next question…" : "Continue"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
    >
      <CircleAlert size={16} className="mt-1 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
