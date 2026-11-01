"use client";

import { useRef, useState } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { courseTopics, type Difficulty, type TopicId } from "@/lib/learning/types";
import { useLearningProgress } from "./progress-provider";

type PracticeQuestion = {
  id: string;
  topicId: TopicId;
  text: string;
  options: [string, string, string, string];
  topicTags: string[];
  difficulty: Difficulty;
  sourceQuote: string;
};

type QuizSet = {
  source: "model" | "curated";
  questions: PracticeQuestion[];
  gradingToken: string | null;
  message: string;
};

type GradedAnswer = {
  isCorrect: boolean;
  correctOption: number;
  explanation: string;
  sourceQuote: string;
  possibleMisunderstanding: string | null;
  attempt: Parameters<ReturnType<typeof useLearningProgress>["recordAttempt"]>[0];
};

type Explanation = {
  explanation: string;
  possibleMisconception: string;
  followUpActivity: string;
  sourceQuote: string;
  sourceGrounded: boolean;
  notice: string;
};

async function getErrorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return payload?.error ?? "The request failed. Check your connection and retry.";
};

type MaterialChecklistItem = {
  taskId: string;
  topicId: TopicId;
  title: string;
  rationale: string;
  completed: boolean;
};

type MaterialTools = {
  summary: string;
  sourceQuotes: string[];
  checklist: Array<{
    taskId: string;
    topicId: TopicId;
    title: string;
    rationale: string;
    priority: "high" | "medium" | "review";
    completed: boolean;
  }>;
  notice: string;
};

function isMaterialChecklistItem(value: unknown): value is MaterialChecklistItem {
  if (!value || typeof value !== "object") return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.taskId === "string" &&
    typeof task.topicId === "string" &&
    courseTopics.some((topic) => topic.id === task.topicId) &&
    typeof task.title === "string" &&
    typeof task.rationale === "string" &&
    typeof task.completed === "boolean"
  );
}

export function AIPractice({
  initialTopic,
  userId,
}: {
  initialTopic?: TopicId;
  userId: string;
}) {
  const [topicId, setTopicId] = useState<TopicId>(
    initialTopic ?? courseTopics[0].id,
  );
  const [level, setLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [studyText, setStudyText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [materialTools, setMaterialTools] = useState<MaterialTools | null>(null);
  const [materialTasks, setMaterialTasks] = useState<MaterialChecklistItem[]>([]);
  const [quiz, setQuiz] = useState<QuizSet | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [graded, setGraded] = useState<GradedAnswer | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [busy, setBusy] = useState<"generate" | "grade" | "explain" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const gradeInFlight = useRef(false);
  const { recordAttempt, demoMode } = useLearningProgress();
  const question = quiz?.questions[questionIndex] ?? null;

  async function generateQuiz() {
    setBusy("generate");
    setError(null);
    setQuiz(null);
    setGraded(null);
    setExplanation(null);
    setQuestionIndex(0);
    setSelectedOption(null);
    gradeInFlight.current = false;
    try {
      const response = await fetch("/api/learning/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, level, difficulty, studyText }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      setQuiz((await response.json()) as QuizSet);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not generate questions. Please retry.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function uploadMaterial(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    setMaterialTools(null);
    setMaterialTasks([]);
    try {
      const form = new FormData();
      form.set("topicId", topicId);
      form.set("file", file);
      const response = await fetch("/api/learning/study-material", {
        method: "POST",
        body: form,
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const result = (await response.json()) as {
        fileName: string;
        text: string;
        characterCount: number;
        pages: number | null;
      };
      setStudyText(result.text);
      setUploadedFileName(result.fileName);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Text extraction failed. Retry the upload or choose another file.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function generateMaterialTools() {
    setBusy("generate");
    setError(null);
    setMaterialTools(null);
    setMaterialTasks([]);
    try {
      const response = await fetch("/api/learning/material-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, studyText }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const result = (await response.json()) as MaterialTools;
      const tasks = result.checklist;
      setMaterialTools(result);
      setMaterialTasks(tasks);
      if (demoMode) {
        try {
          const existing = window.localStorage.getItem(
            `learnloop:demo-material-tasks:${userId}`,
          );
          const prior: unknown = existing ? JSON.parse(existing) : [];
          const priorTasks = Array.isArray(prior)
            ? prior.filter(isMaterialChecklistItem)
            : [];
          window.localStorage.setItem(
            `learnloop:demo-material-tasks:${userId}`,
            JSON.stringify([
              ...priorTasks.filter(
                (item) => !tasks.some((task) => item.taskId === task.taskId),
              ),
              ...tasks,
            ]),
          );
        } catch {
          setError("Checklist generated, but browser storage is unavailable.");
        }
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not summarize this material. Please retry.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function toggleMaterialTask(taskId: string) {
    const next = materialTasks.map((task) =>
      task.taskId === taskId ? { ...task, completed: !task.completed } : task,
    );
    setMaterialTasks(next);
    if (demoMode) {
      try {
        window.localStorage.setItem(
          `learnloop:demo-material-tasks:${userId}`,
          JSON.stringify(next),
        );
      } catch {
        setError("Checklist change was not saved in this browser.");
      }
      return;
    }
    try {
      const response = await fetch("/api/learning/revision-tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: next.map((task) => ({
            taskId: task.taskId,
            topicId: task.topicId,
            title: task.title,
            rationale: task.rationale,
            priority: "medium",
            completed: task.completed,
          })),
        }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Checklist change could not be saved.",
      );
    }
  }

  async function submitAnswer() {
    if (
      !quiz ||
      !question ||
      selectedOption === null ||
      graded ||
      busy ||
      gradeInFlight.current
    ) {
      return;
    }
    gradeInFlight.current = true;
    setBusy("grade");
    setError(null);
    let submitted = false;
    try {
      const response = await fetch("/api/learning/submit-generated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          selectedOption,
          gradingToken: quiz.gradingToken,
        }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const result = (await response.json()) as GradedAnswer;
      setGraded(result);
      recordAttempt(result.attempt);
      submitted = true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not check this answer. Please retry.",
      );
    } finally {
      if (!submitted) gradeInFlight.current = false;
      setBusy(null);
    }
  }

  async function askForExplanation() {
    if (!question || selectedOption === null || !graded || busy) return;
    setBusy("explain");
    setError(null);
    try {
      const response = await fetch("/api/learning/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.text,
          selectedAnswer: question.options[selectedOption],
          correctAnswer: question.options[graded.correctOption],
          topicId: question.topicId,
          sourceMaterial: studyText,
        }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      setExplanation((await response.json()) as Explanation);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not generate an explanation. Please retry.",
      );
    } finally {
      setBusy(null);
    }
  }

  function nextQuestion() {
    gradeInFlight.current = false;
    setQuestionIndex((current) => current + 1);
    setSelectedOption(null);
    setGraded(null);
    setExplanation(null);
    setError(null);
  }

  return (
    <section className="mt-7 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <Sparkles size={19} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
            AI-assisted study
          </p>
          <h2 className="text-lg font-semibold text-[#17213f]">
            Generate extra practice
          </h2>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Model-generated questions are checked on the server. If the provider is
        not configured, curated course questions are clearly identified instead.
      </p>

      {!question && (
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="text-xs font-medium text-slate-600">
            Topic
            <select
              value={topicId}
              onChange={(event) => {
                const topic = courseTopics.find(
                  (item) => item.id === event.target.value,
                );
                if (topic) setTopicId(topic.id);
              }}
              className="auth-input mt-1.5"
              disabled={busy !== null}
            >
              {courseTopics.map((topic) => (
                <option value={topic.id} key={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Learning level
            <select
              value={level}
              onChange={(event) => {
                const value = event.target.value;
                if (
                  value === "beginner" ||
                  value === "intermediate" ||
                  value === "advanced"
                ) {
                  setLevel(value);
                }
              }}
              className="auth-input mt-1.5"
              disabled={busy !== null}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Difficulty
            <select
              value={difficulty}
              onChange={(event) => {
                if (
                  event.target.value === "easy" ||
                  event.target.value === "medium" ||
                  event.target.value === "hard"
                ) {
                  setDifficulty(event.target.value);
                }
              }}
              className="auth-input mt-1.5"
              disabled={busy !== null}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600 sm:col-span-3">
            Upload study material (PDF or TXT, up to 10 MB)
            <input
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              onChange={(event) =>
                void uploadMaterial(event.target.files?.[0] ?? null)
              }
              className="auth-input mt-1.5"
              disabled={busy !== null || uploading}
            />
            {uploading && (
              <span
                role="status"
                className="mt-2 flex items-center gap-2 text-xs text-indigo-700"
              >
                <LoaderCircle
                  size={14}
                  className="animate-spin"
                  aria-hidden="true"
                />
                Uploading and extracting text securely on the server…
              </span>
            )}
            {uploadedFileName && !uploading && (
              <span className="mt-2 block text-xs text-emerald-700">
                Extracted text from {uploadedFileName}.
              </span>
            )}
          </label>
          <label className="text-xs font-medium text-slate-600 sm:col-span-3">
            Optional extracted study text
            <textarea
              value={studyText}
              onChange={(event) => setStudyText(event.target.value)}
              maxLength={12_000}
              rows={3}
              placeholder="Paste relevant notes or extracted text (up to 12,000 characters)"
              className="auth-input mt-1.5 resize-y"
              disabled={busy !== null}
            />
            <span className="mt-1 block text-right text-[11px] text-slate-400">
              {studyText.length.toLocaleString()} / 12,000
            </span>
          </label>
          {studyText && (
            <>
              <details className="sm:col-span-3">
                <summary className="cursor-pointer text-xs font-semibold text-indigo-700">
                  Preview extracted text ({studyText.length.toLocaleString()} characters)
                </summary>
                <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs leading-5 text-slate-600">
                  {studyText.slice(0, 2500)}
                  {studyText.length > 2500 ? "\n…preview truncated" : ""}
                </pre>
              </details>
              <button
                type="button"
                onClick={() => void generateMaterialTools()}
                disabled={busy !== null || uploading}
                className="button-secondary sm:col-span-3 sm:justify-self-start"
              >
                {busy === "generate" && (
                  <LoaderCircle
                    size={15}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                )}
                {busy === "generate"
                  ? "Summarizing material…"
                  : "Generate summary and checklist"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => void generateQuiz()}
            disabled={busy !== null || uploading}
            className="button-primary sm:col-span-3 sm:justify-self-start"
          >
            {busy === "generate" ? (
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={16} aria-hidden="true" />
            )}
            {busy === "generate" ? "Generating…" : "Generate 3 questions"}
          </button>
        </div>
      )}

      {materialTools && (
        <div className="mt-5 rounded-2xl border border-indigo-100 bg-white p-4 sm:p-5">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
            AI-generated summary · source-matched
          </span>
          <h3 className="mt-3 text-base font-semibold text-[#17213f]">
            {courseTopics.find((topic) => topic.id === topicId)?.title} summary
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {materialTools.summary}
          </p>
          <div className="mt-3 space-y-2">
            {materialTools.sourceQuotes.map((quote) => (
              <blockquote
                key={quote}
                className="border-l-2 border-indigo-300 pl-3 text-xs leading-5 text-slate-500"
              >
                “{quote}”
              </blockquote>
            ))}
          </div>
          <h4 className="mt-5 text-sm font-semibold text-[#17213f]">
            Study checklist
          </h4>
          <ul className="mt-2 space-y-2">
            {materialTasks.map((task) => (
              <li key={task.taskId}>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => void toggleMaterialTask(task.taskId)}
                    className="mt-1 accent-indigo-600"
                  />
                  <span>
                    <strong className="font-medium">{task.title}</strong>
                    <span className="block text-xs leading-5 text-slate-500">
                      {task.rationale}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-5 text-slate-500">
            {materialTools.notice}
          </p>
        </div>
      )}

      {quiz && question && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                quiz.source === "model"
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {quiz.source === "model"
                ? "Model-generated · unverified"
                : "Curated course content"}
            </span>
            <span className="text-xs text-slate-400">
              Question {questionIndex + 1} of {quiz.questions.length}
            </span>
          </div>
          <p className="mt-3 text-xs font-medium text-slate-500">
            {question.difficulty} · {question.topicTags.join(" · ")}
          </p>
          <h3 className="mt-2 text-lg font-semibold leading-7 text-[#17213f]">
            {question.text}
          </h3>
          <fieldset
            className="mt-4 space-y-2"
            disabled={Boolean(graded) || busy !== null}
          >
            <legend className="sr-only">Choose one answer</legend>
            {question.options.map((option, index) => (
              <label
                key={`${question.id}-${index}`}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${
                  graded?.correctOption === index
                    ? "border-emerald-300 bg-emerald-50"
                    : graded && selectedOption === index
                      ? "border-rose-200 bg-rose-50"
                      : selectedOption === index
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-slate-200 hover:border-indigo-200"
                }`}
              >
                <input
                  type="radio"
                  name="ai-practice-answer"
                  checked={selectedOption === index}
                  onChange={() => setSelectedOption(index)}
                  className="mt-0.5 accent-indigo-600"
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>

          {graded && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm leading-6 text-indigo-950"
            >
              <p className="font-semibold">
                {graded.isCorrect ? "Correct." : "Review this answer."}
              </p>
              <p className="mt-1">{graded.explanation}</p>
              {graded.sourceQuote && (
                <blockquote className="mt-3 border-l-2 border-indigo-300 pl-3 text-xs text-indigo-900">
                  Source excerpt: “{graded.sourceQuote}”
                </blockquote>
              )}
              <p className="mt-3 text-xs text-indigo-800">
                Check model-generated explanations against trusted learning
                material.
              </p>
            </div>
          )}

          {explanation && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-[#17213f]">AI concept explanation</p>
              <p className="mt-1">{explanation.explanation}</p>
              <p className="mt-2 text-xs">
                Possible misunderstanding hypothesis:{" "}
                {explanation.possibleMisconception}
              </p>
              <p className="mt-2 text-xs">
                Try next: {explanation.followUpActivity}
              </p>
              {explanation.sourceQuote && (
                <blockquote className="mt-2 border-l-2 border-indigo-300 pl-3 text-xs">
                  Source excerpt: “{explanation.sourceQuote}”
                  {explanation.sourceGrounded
                    ? " (quote matched your supplied material)"
                    : ""}
                </blockquote>
              )}
              <p className="mt-2 text-[11px] text-slate-500">
                {explanation.notice}
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
        >
          {error}
        </p>
      )}

      {quiz && question && (
        <div className="mt-4 flex flex-wrap gap-3">
          {!graded ? (
            <button
              type="button"
              onClick={() => void submitAnswer()}
              disabled={selectedOption === null || busy !== null}
              className="button-primary disabled:opacity-50"
            >
              {busy === "grade" ? "Checking…" : "Check answer"}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void askForExplanation()}
                disabled={busy !== null || explanation !== null}
                className="button-secondary disabled:opacity-50"
              >
                {busy === "explain" ? "Generating explanation…" : "Ask AI to explain"}
              </button>
              {questionIndex < quiz.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="button-primary"
                >
                  Next question <ArrowRight size={15} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setQuiz(null);
                    setGraded(null);
                    setExplanation(null);
                    setSelectedOption(null);
                  }}
                  className="button-secondary"
                >
                  Create another set
                </button>
              )}
            </>
          )}
        </div>
      )}
      {quiz && <p className="mt-3 text-xs leading-5 text-slate-500">{quiz.message}</p>}
    </section>
  );
}
