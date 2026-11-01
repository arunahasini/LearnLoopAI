import { describe, expect, it } from "vitest";
import {
  explainRequestSchema,
  generateQuizRequestSchema,
  generatedQuizSchema,
  studyPlanRequestSchema,
} from "./schemas";
import { generateValidatedOutput, ModelOutputError } from "./validation";

describe("AI request validation", () => {
  it("rejects unknown topics, unsupported difficulties, and oversized source text", () => {
    expect(
      generateQuizRequestSchema.safeParse({
        topicId: "graphs",
        level: "beginner",
        difficulty: "easy",
      }).success,
    ).toBe(false);
    expect(
      generateQuizRequestSchema.safeParse({
        topicId: "arrays",
        level: "beginner",
        difficulty: "impossible",
      }).success,
    ).toBe(false);
    expect(
      generateQuizRequestSchema.safeParse({
        topicId: "arrays",
        level: "beginner",
        difficulty: "easy",
        studyText: "x".repeat(12_001),
      }).success,
    ).toBe(false);
  });

  it("rejects missing explanation fields and impossible study evidence", () => {
    expect(
      explainRequestSchema.safeParse({
        question: "What is an array?",
        selectedAnswer: "A collection",
        correctAnswer: "A collection with indexed access",
        topicId: "arrays",
        extra: "not allowed",
      }).success,
    ).toBe(false);
    expect(
      studyPlanRequestSchema.safeParse({
        masteryEvidence: [
          {
            topicId: "arrays",
            mastery: 40,
            attempts: 2,
            correct: 3,
            status: "low",
          },
        ],
        availableStudyMinutes: 30,
      }).success,
    ).toBe(false);
  });
});

describe("AI response validation", () => {
  it("rejects malformed provider JSON and schema-invalid quiz questions", async () => {
    await expect(
      generateValidatedOutput(
        async () => "{not json",
        generatedQuizSchema,
      ),
    ).rejects.toBeInstanceOf(ModelOutputError);
    await expect(
      generateValidatedOutput(
        async () =>
          JSON.stringify({
            questions: [
              {
                id: "q1",
                topicId: "arrays",
                text: "Question about arrays",
                options: ["A", "A", "C", "D"],
                correctAnswer: 0,
                explanation: "This answer explains the array concept.",
                topicTags: ["arrays"],
                sourceQuote: "",
              },
              {},
              {},
            ],
          }),
        generatedQuizSchema,
      ),
    ).rejects.toBeInstanceOf(ModelOutputError);
  });

  it("surfaces provider failures instead of producing fallback AI output", async () => {
    const providerFailure = new Error("provider unavailable");
    await expect(
      generateValidatedOutput(
        async () => {
          throw providerFailure;
        },
        generatedQuizSchema,
      ),
    ).rejects.toBe(providerFailure);
  });
});
