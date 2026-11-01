import { apiError, getApiUser, readJsonBody } from "@/lib/ai/http";
import { openAssessment } from "@/lib/ai/server";
import { getQuestionById } from "@/lib/learning/course-bank";
import { DEMO_USER_ID } from "@/lib/auth/require-user";
import { persistLearningAttempt } from "@/lib/learning/persistence";
import type { LearningAttempt } from "@/lib/learning/types";
import { z } from "zod";

const submissionSchema = z
  .object({
    questionId: z.string().min(1).max(100),
    selectedOption: z.number().int().min(0).max(3),
    gradingToken: z.string().max(16_384).nullable(),
  })
  .strict();

export async function POST(request: Request) {
  const auth = await getApiUser();
  if (!auth.ok) return auth.response;
  const body = await readJsonBody(request, submissionSchema);
  if ("response" in body) return body.response;

  const { questionId, selectedOption, gradingToken } = body.value;
  let answer: {
    id: string;
    topicId: LearningAttempt["topicId"];
    correctAnswer: number;
    explanation: string;
    sourceQuote: string;
  };

  if (gradingToken) {
    try {
      const assessment = openAssessment(gradingToken, auth.user.id);
      const found = assessment.answers.find((item) => item.id === questionId);
      if (!found) return apiError("That generated question is not in this assessment.", 400);
      answer = found;
    } catch {
      return apiError("This assessment has expired or is no longer valid. Generate a new set.", 400);
    }
  } else {
    const curated = getQuestionById(questionId);
    if (!curated) return apiError("That curated question is unavailable.", 404);
    answer = {
      id: curated.id,
      topicId: curated.topicId,
      correctAnswer: curated.correctAnswer,
      explanation: curated.explanation,
      sourceQuote: "",
    };
  }

  const isCorrect = selectedOption === answer.correctAnswer;
  const attempt: LearningAttempt = {
    id: crypto.randomUUID(),
    questionId: answer.id,
    topicId: answer.topicId,
    selectedOption,
    isCorrect,
    attemptedAt: new Date().toISOString(),
  };
  if (auth.user.id !== DEMO_USER_ID) {
    try {
      await persistLearningAttempt(auth.user.id, attempt);
    } catch (error) {
      return apiError(
        error instanceof Error
          ? error.message
          : "Your answer was checked but progress could not be saved.",
        503,
      );
    }
  }
  return Response.json(
    {
      isCorrect,
      correctOption: answer.correctAnswer,
      explanation: answer.explanation,
      sourceQuote: answer.sourceQuote,
      possibleMisunderstanding: isCorrect
        ? null
        : "This may reflect a misunderstanding of the concept; compare the chosen answer with the explanation.",
      attempt,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
