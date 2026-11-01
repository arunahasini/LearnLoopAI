import { z } from "zod";
import { courseTopics } from "../learning/types";

const topicIds = courseTopics.map((topic) => topic.id) as [
  (typeof courseTopics)[number]["id"],
  ...(typeof courseTopics)[number]["id"][],
];
const topicIdSchema = z.enum(topicIds);
const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const generateQuizRequestSchema = z
  .object({
    topicId: topicIdSchema,
    level: z.enum(["beginner", "intermediate", "advanced"]),
    difficulty: difficultySchema,
    studyText: z.string().max(12_000).optional(),
  })
  .strict();

export const generatedQuestionSchema = z
  .object({
    id: z.string().min(1).max(80),
    topicId: topicIdSchema,
    text: z.string().min(8).max(700),
    options: z.tuple([
      z.string().min(1).max(300),
      z.string().min(1).max(300),
      z.string().min(1).max(300),
      z.string().min(1).max(300),
    ]),
    correctAnswer: z.number().int().min(0).max(3),
    explanation: z.string().min(10).max(1200),
    topicTags: z.array(z.string().min(1).max(40)).min(1).max(6),
    sourceQuote: z.string().max(300),
  })
  .strict()
  .refine((question) => new Set(question.options).size === 4, {
    message: "Answer options must be unique.",
  });

export const generatedQuizSchema = z
  .object({
    questions: z.array(generatedQuestionSchema).length(3),
  })
  .strict()
  .refine(
    ({ questions }) =>
      new Set(questions.map((question) => question.id)).size ===
      questions.length,
    { message: "Question IDs must be unique." },
  );

export const explainRequestSchema = z
  .object({
    question: z.string().min(1).max(1200),
    selectedAnswer: z.string().min(1).max(300),
    correctAnswer: z.string().min(1).max(300),
    topicId: topicIdSchema,
    sourceMaterial: z.string().max(8_000).optional(),
  })
  .strict();

export const explanationSchema = z
  .object({
    explanation: z.string().min(10).max(1400),
    possibleMisconception: z.string().min(10).max(700),
    followUpActivity: z.string().min(5).max(500),
    sourceQuote: z.string().max(300),
  })
  .strict();

export const studyPlanRequestSchema = z
  .object({
    masteryEvidence: z
      .array(
        z
          .object({
            topicId: topicIdSchema,
            mastery: z.number().min(0).max(100).nullable(),
            attempts: z.number().int().min(0).max(10_000),
            correct: z.number().int().min(0).max(10_000),
            status: z.enum([
              "insufficient-evidence",
              "low",
              "developing",
              "high",
            ]),
          })
          .strict()
          .refine((evidence) => evidence.correct <= evidence.attempts, {
            message: "Correct answers cannot exceed attempts.",
          }),
      )
      .min(1)
      .max(5),
    availableStudyMinutes: z.number().int().min(5).max(600),
    deadline: z.iso.date().optional(),
  })
  .strict()
  .refine(
    ({ masteryEvidence }) =>
      new Set(masteryEvidence.map((evidence) => evidence.topicId)).size ===
      masteryEvidence.length,
    { message: "Each topic can appear only once." },
  );

export const studyPlanSchema = z
  .object({
    tasks: z
      .array(
        z
          .object({
            topicId: topicIdSchema,
            title: z.string().min(4).max(120),
            rationale: z.string().min(8).max(400),
            priority: z.enum(["high", "medium", "review"]),
            durationMinutes: z.number().int().min(5).max(120),
          })
          .strict(),
      )
      .min(1)
      .max(8),
  })
  .strict()
  .refine(
    ({ tasks }) =>
      new Set(tasks.map((task) => task.topicId)).size === tasks.length,
    { message: "A study plan may include each topic only once." },
  );

export const materialToolsRequestSchema = z
  .object({
    topicId: topicIdSchema,
    studyText: z.string().min(80).max(12_000),
  })
  .strict();

export const materialToolsSchema = z
  .object({
    summary: z.string().min(30).max(1800),
    sourceQuotes: z.array(z.string().min(1).max(300)).min(1).max(3),
    checklist: z
      .array(
        z
          .object({
            title: z.string().min(4).max(120),
            rationale: z.string().min(8).max(300),
          })
          .strict(),
      )
      .min(3)
      .max(6),
  })
  .strict();

export const sealedAssessmentSchema = z
  .object({
    userId: z.string().min(1),
    expiresAt: z.number().int(),
    answers: z
      .array(
        z
          .object({
            id: z.string().min(1),
            topicId: topicIdSchema,
            correctAnswer: z.number().int().min(0).max(3),
            explanation: z.string().min(10).max(1200),
            sourceQuote: z.string().max(300),
          })
          .strict(),
      )
      .length(3),
  })
  .strict();

export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type ExplainRequest = z.infer<typeof explainRequestSchema>;
export type StudyPlanRequest = z.infer<typeof studyPlanRequestSchema>;
