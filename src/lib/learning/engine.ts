import {
  courseTopics,
  type AdaptiveRecommendation,
  type LearningAttempt,
  type Question,
  type TopicId,
  type TopicPerformance,
} from "./types";

export const MINIMUM_MASTERY_ATTEMPTS = 3;
export const RECENT_WINDOW_SIZE = 5;
export const LOW_MASTERY_THRESHOLD = 0.5;
export const HIGH_MASTERY_THRESHOLD = 0.8;

export function scoreAnswer(question: Question, selectedOption: number): boolean {
  if (
    !Number.isInteger(selectedOption) ||
    selectedOption < 0 ||
    selectedOption >= question.options.length
  ) {
    throw new RangeError("Selected option must be an index from 0 to 3.");
  }

  return selectedOption === question.correctAnswer;
}

export function calculateTopicPerformance(
  topicId: TopicId,
  attempts: readonly LearningAttempt[],
): TopicPerformance {
  const topicAttempts = attempts
    .filter((attempt) => attempt.topicId === topicId)
    .slice()
    .sort(
      (left, right) =>
        Date.parse(left.attemptedAt) - Date.parse(right.attemptedAt),
    );
  const recentAttempts = topicAttempts.slice(-RECENT_WINDOW_SIZE);
  const correct = topicAttempts.filter((attempt) => attempt.isCorrect).length;
  const recentCorrect = recentAttempts.filter(
    (attempt) => attempt.isCorrect,
  ).length;
  const cumulativeAccuracy =
    topicAttempts.length === 0 ? null : correct / topicAttempts.length;
  const recentAccuracy =
    recentAttempts.length === 0
      ? null
      : recentCorrect / recentAttempts.length;

  let status: TopicPerformance["status"] = "insufficient-evidence";
  let mastery: number | null = null;
  if (topicAttempts.length >= MINIMUM_MASTERY_ATTEMPTS) {
    const weighted = (recentAccuracy ?? 0) * 0.6 + (cumulativeAccuracy ?? 0) * 0.4;
    mastery = Math.round(weighted * 100);

    if (weighted < LOW_MASTERY_THRESHOLD) {
      status = "low";
    } else if (weighted < HIGH_MASTERY_THRESHOLD) {
      status = "developing";
    } else {
      status = "high";
    }
  }

  return {
    topicId,
    attempts: topicAttempts.length,
    correct,
    recentAttempts: recentAttempts.length,
    recentCorrect,
    cumulativeAccuracy,
    recentAccuracy,
    mastery,
    status,
  };
}

export function calculateAllTopicPerformance(
  attempts: readonly LearningAttempt[],
): TopicPerformance[] {
  return courseTopics.map((topic) =>
    calculateTopicPerformance(topic.id, attempts),
  );
}

export function recommendNextAction(
  performance: TopicPerformance,
): AdaptiveRecommendation {
  if (
    performance.status === "insufficient-evidence" ||
    performance.status === "low"
  ) {
    return {
      topicId: performance.topicId,
      status: performance.status,
      title: "Revisit the foundations",
      explanation:
        performance.status === "insufficient-evidence"
          ? "There isn’t enough practice evidence to estimate mastery yet. Start with a foundational explanation and an easier question."
          : "Recent answers suggest revisiting the core idea before moving on. Review a short foundation and try an easier question.",
      actionLabel: "Review foundations",
      actionType: "foundation",
      difficulty: "easy",
    };
  }

  if (performance.status === "developing") {
    return {
      topicId: performance.topicId,
      status: performance.status,
      title: "Practice the tricky parts",
      explanation:
        "You’re building understanding. Targeted questions can help connect the parts that still feel uncertain.",
      actionLabel: "Try targeted practice",
      actionType: "targeted-practice",
      difficulty: "medium",
    };
  }

  const spacedReview =
    performance.attempts >= MINIMUM_MASTERY_ATTEMPTS &&
    performance.attempts % 3 === 0;

  return {
    topicId: performance.topicId,
    status: performance.status,
    title: spacedReview ? "Keep it fresh" : "Ready for a challenge",
    explanation: spacedReview
      ? "Your recent performance is strong. A spaced review helps keep this topic familiar over time."
      : "Your recent and overall performance are both strong. Try a harder application question.",
    actionLabel: spacedReview ? "Start a spaced review" : "Try a challenge",
    actionType: spacedReview ? "spaced-review" : "challenge",
    difficulty: spacedReview ? "medium" : "hard",
  };
}

export function getTopicAttempts(
  topicId: TopicId,
  attempts: readonly LearningAttempt[],
): LearningAttempt[] {
  return attempts
    .filter((attempt) => attempt.topicId === topicId)
    .slice()
    .sort(
      (left, right) =>
        Date.parse(right.attemptedAt) - Date.parse(left.attemptedAt),
    );
}
