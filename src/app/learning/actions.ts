"use server";

import { requireUser } from "@/lib/auth/require-user";
import { isDemoUser } from "@/lib/auth/require-user";
import { persistLearningAttempt } from "@/lib/learning/persistence";
import { scoreAnswer } from "@/lib/learning/engine";
import {
  getQuestionById,
  getQuestionForTopic,
  questionBank,
} from "@/lib/learning/course-bank";
import {
  courseTopics,
  type Difficulty,
  type PublicQuestion,
  type QuizFeedback,
  type TopicId,
} from "@/lib/learning/types";

export type LearningActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isTopicId(value: string): value is TopicId {
  return courseTopics.some((topic) => topic.id === value);
}

function isDifficulty(value: string): value is Difficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function toPublicQuestion(
  questionId: string,
  topicId: TopicId,
): PublicQuestion | null {
  const question = questionBank.find((entry) => entry.id === questionId);
  if (!question) return null;

  const topicName =
    courseTopics.find((topic) => topic.id === topicId)?.title ?? "Practice";

  return {
    id: question.id,
    topicId: question.topicId,
    text: question.text,
    options: question.options,
    difficulty: question.difficulty,
    topicName,
    totalQuestions: questionBank.filter((entry) => entry.topicId === topicId)
      .length,
  };
}

export async function getNextQuestionAction(
  topicIdInput: string,
  difficultyInput: string,
  excludedIdsInput: string[],
): Promise<LearningActionResult<PublicQuestion>> {
  await requireUser();

  if (!isTopicId(topicIdInput)) {
    return { success: false, error: "Choose a valid course topic." };
  }
  if (!isDifficulty(difficultyInput)) {
    return { success: false, error: "Choose a valid practice difficulty." };
  }
  if (
    !Array.isArray(excludedIdsInput) ||
    excludedIdsInput.length > 100 ||
    excludedIdsInput.some(
      (questionId) =>
        typeof questionId !== "string" || questionId.length > 100,
    )
  ) {
    return { success: false, error: "The practice request was invalid." };
  }

  const question = getQuestionForTopic(
    topicIdInput,
    difficultyInput,
    excludedIdsInput,
  );
  if (!question) {
    return { success: false, error: "No practice questions are available." };
  }

  const publicQuestion = toPublicQuestion(question.id, topicIdInput);
  if (!publicQuestion) {
    return { success: false, error: "The practice question is unavailable." };
  }

  return { success: true, data: publicQuestion };
}

export async function submitAnswerAction(
  questionId: string,
  selectedOption: number,
): Promise<LearningActionResult<QuizFeedback>> {
  const user = await requireUser();

  if (
    typeof questionId !== "string" ||
    questionId.length > 100 ||
    !Number.isInteger(selectedOption) ||
    selectedOption < 0 ||
    selectedOption > 3
  ) {
    return { success: false, error: "Choose one of the available answers." };
  }

  const question = getQuestionById(questionId);
  if (!question) {
    return {
      success: false,
      error: "That question is no longer available. Please choose another.",
    };
  }

  const isCorrect = scoreAnswer(question, selectedOption);
  const misconception = isCorrect
    ? null
    : (question.misconceptionTags?.[selectedOption] ?? null);
  const attemptId = crypto.randomUUID();
  const attempt = {
    id: attemptId,
    questionId: question.id,
    topicId: question.topicId,
    selectedOption,
    isCorrect,
    attemptedAt: new Date().toISOString(),
  };
  if (!isDemoUser(user)) {
    try {
      await persistLearningAttempt(user.id, attempt);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Your answer could not be saved. Please retry.",
      };
    }
  }

  return {
    success: true,
    data: {
      isCorrect,
      correctOption: question.correctAnswer,
      explanation: question.explanation,
      misconception,
      possibleMisunderstanding:
        !isCorrect && !misconception
          ? "This answer may reflect a misunderstanding of the concept. Review the explanation and compare the operations involved."
          : null,
      attempt,
    },
  };
}
