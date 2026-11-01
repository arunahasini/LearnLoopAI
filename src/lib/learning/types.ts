export type TopicId =
  | "arrays"
  | "linked-lists"
  | "stacks"
  | "queues"
  | "trees";

export type Difficulty = "easy" | "medium" | "hard";

export type MisconceptionTag = {
  tag: string;
  explanation: string;
};

export type Question = {
  id: string;
  topicId: TopicId;
  text: string;
  options: readonly [string, string, string, string];
  correctAnswer: number;
  explanation: string;
  difficulty: Difficulty;
  misconceptionTags?: Partial<Record<number, MisconceptionTag>>;
};

export type PublicQuestion = Omit<
  Question,
  "correctAnswer" | "explanation" | "misconceptionTags"
> & {
  options: readonly [string, string, string, string];
  topicName: string;
  totalQuestions: number;
};

export type LearningAttempt = {
  id: string;
  questionId: string;
  topicId: TopicId;
  selectedOption: number;
  isCorrect: boolean;
  attemptedAt: string;
};

export type TopicPerformance = {
  topicId: TopicId;
  attempts: number;
  correct: number;
  recentAttempts: number;
  recentCorrect: number;
  cumulativeAccuracy: number | null;
  recentAccuracy: number | null;
  mastery: number | null;
  status: "insufficient-evidence" | "low" | "developing" | "high";
};

export type AdaptiveRecommendation = {
  topicId: TopicId;
  status: TopicPerformance["status"];
  title: string;
  explanation: string;
  actionLabel: string;
  actionType: "foundation" | "targeted-practice" | "challenge" | "spaced-review";
  difficulty: Difficulty;
};

export type QuizFeedback = {
  isCorrect: boolean;
  correctOption: number;
  explanation: string;
  misconception: MisconceptionTag | null;
  possibleMisunderstanding: string | null;
  attempt: LearningAttempt;
};

export const courseTopics: ReadonlyArray<{
  id: TopicId;
  title: string;
  description: string;
}> = [
  {
    id: "arrays",
    title: "Arrays",
    description: "Indexing, traversal, and common array operations.",
  },
  {
    id: "linked-lists",
    title: "Linked Lists",
    description: "Nodes, pointers, traversal, insertion, and reversal.",
  },
  {
    id: "stacks",
    title: "Stacks",
    description: "Last-in, first-out ordering and stack operations.",
  },
  {
    id: "queues",
    title: "Queues",
    description: "First-in, first-out ordering and queue operations.",
  },
  {
    id: "trees",
    title: "Trees",
    description: "Rooted structure, traversal, and binary search trees.",
  },
];
