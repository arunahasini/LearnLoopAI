import { describe, expect, it } from "vitest";
import {
  calculateTopicPerformance,
  recommendNextAction,
  scoreAnswer,
} from "./engine";
import type { LearningAttempt, Question } from "./types";

const question: Question = {
  id: "test-array-question",
  topicId: "arrays",
  text: "Which option is correct?",
  options: ["A", "B", "C", "D"],
  correctAnswer: 2,
  explanation: "Option C is correct.",
  difficulty: "easy",
};

function attemptsFor(
  outcomes: boolean[],
  topicId: LearningAttempt["topicId"] = "arrays",
): LearningAttempt[] {
  return outcomes.map((isCorrect, index) => ({
    id: `attempt-${index}`,
    questionId: `question-${index}`,
    topicId,
    selectedOption: isCorrect ? 2 : 1,
    isCorrect,
    attemptedAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
  }));
}

describe("scoreAnswer", () => {
  it("scores the authored correct option", () => {
    expect(scoreAnswer(question, 2)).toBe(true);
    expect(scoreAnswer(question, 1)).toBe(false);
  });

  it("rejects invalid option indexes", () => {
    expect(() => scoreAnswer(question, -1)).toThrow(RangeError);
    expect(() => scoreAnswer(question, 4)).toThrow(RangeError);
    expect(() => scoreAnswer(question, 1.5)).toThrow(RangeError);
  });
});

describe("calculateTopicPerformance", () => {
  it("does not estimate mastery before the minimum evidence threshold", () => {
    const result = calculateTopicPerformance("arrays", attemptsFor([true, true]));

    expect(result.attempts).toBe(2);
    expect(result.correct).toBe(2);
    expect(result.mastery).toBeNull();
    expect(result.status).toBe("insufficient-evidence");
  });

  it("combines recent and cumulative accuracy deterministically", () => {
    const result = calculateTopicPerformance(
      "arrays",
      attemptsFor([true, true, true, true, true, false, false, false]),
    );

    expect(result.cumulativeAccuracy).toBe(5 / 8);
    expect(result.recentAccuracy).toBe(2 / 5);
    expect(result.mastery).toBe(49);
    expect(result.status).toBe("low");
  });

  it("tracks only attempts for the requested topic", () => {
    const result = calculateTopicPerformance("arrays", [
      ...attemptsFor([true, true, false], "arrays"),
      ...attemptsFor([false, false, false], "trees"),
    ]);

    expect(result.attempts).toBe(3);
    expect(result.correct).toBe(2);
    expect(result.mastery).toBe(67);
  });

  it("updates an insufficient-evidence topic to low after three incorrect answers", () => {
    const result = calculateTopicPerformance(
      "arrays",
      attemptsFor([false, false, false]),
    );
    const recommendation = recommendNextAction(result);

    expect(result.status).toBe("low");
    expect(result.mastery).toBe(0);
    expect(recommendation.difficulty).toBe("easy");
    expect(recommendation.explanation).toContain(
      "Recent answers suggest revisiting the core idea",
    );
  });
});

describe("recommendNextAction", () => {
  it("recommends foundational explanation and easy practice without enough evidence", () => {
    const recommendation = recommendNextAction(
      calculateTopicPerformance("arrays", []),
    );

    expect(recommendation.actionType).toBe("foundation");
    expect(recommendation.difficulty).toBe("easy");
    expect(recommendation.explanation).toContain("foundational explanation");
  });

  it("recommends targeted medium practice for developing mastery", () => {
    const recommendation = recommendNextAction(
      calculateTopicPerformance("arrays", attemptsFor([true, true, false])),
    );

    expect(recommendation.status).toBe("developing");
    expect(recommendation.actionType).toBe("targeted-practice");
    expect(recommendation.difficulty).toBe("medium");
  });

  it("uses a spaced review for high mastery at the review interval", () => {
    const recommendation = recommendNextAction(
      calculateTopicPerformance(
        "arrays",
        attemptsFor([true, true, true]),
      ),
    );

    expect(recommendation.status).toBe("high");
    expect(recommendation.actionType).toBe("spaced-review");
    expect(recommendation.difficulty).toBe("medium");
  });

  it("offers a harder application question for high mastery between review intervals", () => {
    const recommendation = recommendNextAction(
      calculateTopicPerformance(
        "arrays",
        attemptsFor([true, true, true, true]),
      ),
    );

    expect(recommendation.actionType).toBe("challenge");
    expect(recommendation.difficulty).toBe("hard");
  });
});
