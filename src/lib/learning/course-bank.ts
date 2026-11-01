import "server-only";
import type { Difficulty, Question, TopicId } from "./types";

export const questionBank: readonly Question[] = [
  {
    id: "arrays-easy-index",
    topicId: "arrays",
    text: "An array stores values in contiguous memory. What is the time complexity of reading the value at a known index?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: 0,
    explanation:
      "An array can calculate an element's address from its starting address and index, so direct indexed access takes constant time.",
    difficulty: "easy",
  },
  {
    id: "arrays-easy-position",
    topicId: "arrays",
    text: "In the array [12, 18, 25, 31], using zero-based indexing, which value is at index 2?",
    options: ["18", "25", "31", "12"],
    correctAnswer: 1,
    explanation:
      "Zero-based indexing starts with index 0, so index 2 refers to the third value, 25.",
    difficulty: "easy",
    misconceptionTags: {
      0: {
        tag: "one-based-index-counting",
        explanation:
          "With zero-based indexing, index 0 is the first item. Index 2 is the third item, not the second.",
      },
    },
  },
  {
    id: "arrays-medium-search",
    topicId: "arrays",
    text: "You need to find a value in an unsorted array of n items. What is the worst-case time complexity of a simple scan?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correctAnswer: 2,
    explanation:
      "Without ordering or an index, the value may be at the final position or absent, so every item may need to be checked.",
    difficulty: "medium",
    misconceptionTags: {
      1: {
        tag: "binary-search-on-unsorted-data",
        explanation:
          "Binary search needs sorted data to safely discard half of the remaining candidates.",
      },
      0: {
        tag: "indexed-access-confused-with-search",
        explanation:
          "Constant-time access applies when the index is already known; finding an unknown value can require scanning.",
      },
    },
  },
  {
    id: "arrays-hard-prefix",
    topicId: "arrays",
    text: "A static array is used to answer many range-sum queries. Which preprocessing approach gives O(1) time per query after O(n) setup?",
    options: [
      "Build a prefix-sum array",
      "Sort the array with comparison sort",
      "Use binary search for every range",
      "Reverse the array once",
    ],
    correctAnswer: 0,
    explanation:
      "Prefix sums let a range sum be computed as the difference of two cumulative sums, after a single linear pass.",
    difficulty: "hard",
    misconceptionTags: {
      2: {
        tag: "binary-search-does-not-aggregate",
        explanation:
          "Binary search finds positions in ordered data; it does not by itself compute the sum of all values in a range.",
      },
    },
  },
  {
    id: "lists-easy-traversal",
    topicId: "linked-lists",
    text: "In a singly linked list, how do you reach the fifth node when you only have the head reference?",
    options: [
      "Use index 4 to jump directly",
      "Follow next references from the head",
      "Read next references backward from the tail",
      "Use binary search on the nodes",
    ],
    correctAnswer: 1,
    explanation:
      "Each node points to the next node, so traversal starts at the head and follows next references one at a time.",
    difficulty: "easy",
    misconceptionTags: {
      0: {
        tag: "array-indexing-assumed-for-list",
        explanation:
          "A standard linked list has no direct index lookup; reaching a position requires following links.",
      },
      2: {
        tag: "singly-list-traversal-direction",
        explanation:
          "A singly linked list stores a forward next reference, not a backward link from the tail.",
      },
    },
  },
  {
    id: "lists-easy-node",
    topicId: "linked-lists",
    text: "In a basic singly linked list, what does each node contain?",
    options: [
      "A value and a reference to the next node",
      "Only an array index",
      "A reference to every node in the list",
      "A sorted copy of the full list",
    ],
    correctAnswer: 0,
    explanation:
      "A singly linked-list node stores its own value and a reference to the next node in the chain.",
    difficulty: "easy",
  },
  {
    id: "lists-medium-insert",
    topicId: "linked-lists",
    text: "You already have a reference to a node in a singly linked list. What is needed to insert a new node immediately after it?",
    options: [
      "Shift every later node one place",
      "Set the new node's next to the current next, then update the current node's next",
      "Rebuild the list from the head",
      "Sort the list again",
    ],
    correctAnswer: 1,
    explanation:
      "With the node reference already available, insertion updates two links. No later elements need to be shifted.",
    difficulty: "medium",
    misconceptionTags: {
      0: {
        tag: "array-shifting-assumed-for-list",
        explanation:
          "Unlike an array, a linked list inserts by changing references rather than shifting subsequent elements.",
      },
    },
  },
  {
    id: "lists-hard-reverse",
    topicId: "linked-lists",
    text: "When reversing a singly linked list iteratively, why must you save the next node before changing the current node's next reference?",
    options: [
      "To preserve the remaining unprocessed chain",
      "To keep the list sorted",
      "To make each node's value unique",
      "To avoid allocating the head reference",
    ],
    correctAnswer: 0,
    explanation:
      "Changing current.next to point backward would otherwise lose access to the rest of the original forward chain.",
    difficulty: "hard",
    misconceptionTags: {
      1: {
        tag: "reversal-confused-with-sorting",
        explanation:
          "Reversal changes link direction and order; it does not sort node values.",
      },
    },
  },
  {
    id: "stacks-easy-lifo",
    topicId: "stacks",
    text: "A stack receives A, then B, then C. Which item is removed by the next pop operation?",
    options: ["A", "B", "C", "It depends on the array capacity"],
    correctAnswer: 2,
    explanation:
      "A stack is last-in, first-out (LIFO), so the most recently pushed item, C, is popped first.",
    difficulty: "easy",
    misconceptionTags: {
      0: {
        tag: "stack-confused-with-queue",
        explanation:
          "Removing the oldest item is queue behavior. A stack removes the newest item first.",
      },
    },
  },
  {
    id: "stacks-easy-top",
    topicId: "stacks",
    text: "A stack currently contains A at the bottom and B at the top. What does peek return?",
    options: ["A", "B", "Both A and B", "The next item not yet pushed"],
    correctAnswer: 1,
    explanation:
      "Peek reads the top item without removing it. B is currently at the top of the stack.",
    difficulty: "easy",
  },
  {
    id: "stacks-medium-brackets",
    topicId: "stacks",
    text: "Which data structure is most suitable for checking whether nested brackets close in the correct order?",
    options: ["Queue", "Stack", "Unsorted array scan only", "Binary search tree"],
    correctAnswer: 1,
    explanation:
      "The most recently opened bracket must be the first one matched, which is exactly the stack's LIFO behavior.",
    difficulty: "medium",
    misconceptionTags: {
      0: {
        tag: "queue-order-used-for-nesting",
        explanation:
          "Nested brackets require matching the most recent opening bracket, not the oldest one.",
      },
    },
  },
  {
    id: "stacks-hard-min-stack",
    topicId: "stacks",
    text: "A stack must support push, pop, and retrieving the minimum in O(1). Which design can provide this?",
    options: [
      "Keep an auxiliary stack of running minima",
      "Sort the main stack after every push",
      "Use a queue and scan it for each minimum",
      "Store only the current minimum and discard older values",
    ],
    correctAnswer: 0,
    explanation:
      "An auxiliary stack records the minimum at each depth, allowing the current minimum to be read and restored in constant time.",
    difficulty: "hard",
  },
  {
    id: "queues-easy-fifo",
    topicId: "queues",
    text: "A queue receives A, then B, then C. Which item is removed by the next dequeue operation?",
    options: ["A", "B", "C", "It depends on the queue capacity"],
    correctAnswer: 0,
    explanation:
      "A queue is first-in, first-out (FIFO), so the earliest enqueued item, A, is removed first.",
    difficulty: "easy",
    misconceptionTags: {
      2: {
        tag: "queue-confused-with-stack",
        explanation:
          "Removing the newest item is stack behavior. A queue removes the oldest item first.",
      },
    },
  },
  {
    id: "queues-easy-front",
    topicId: "queues",
    text: "A queue contains A at the front followed by B. What does peek return?",
    options: ["A", "B", "The newest item after B", "No item until dequeue"],
    correctAnswer: 0,
    explanation:
      "Peek reads the item at the front without removing it. A is the next item in FIFO order.",
    difficulty: "easy",
  },
  {
    id: "queues-medium-bfs",
    topicId: "queues",
    text: "Why does breadth-first search commonly use a queue?",
    options: [
      "It explores the oldest discovered frontier node first",
      "It always selects the smallest node value",
      "It reverses every edge before visiting",
      "It guarantees constant-time access to any node",
    ],
    correctAnswer: 0,
    explanation:
      "FIFO ordering processes nodes in discovery order, which visits a graph or tree level by level.",
    difficulty: "medium",
    misconceptionTags: {
      1: {
        tag: "bfs-confused-with-value-priority",
        explanation:
          "A basic BFS follows level order, not numeric value order. A priority queue would change the selection rule.",
      },
    },
  },
  {
    id: "queues-hard-circular",
    topicId: "queues",
    text: "In an array-backed circular queue of capacity k, how can the next tail position be calculated after an enqueue?",
    options: [
      "(tail + 1) % k",
      "tail + k",
      "tail * 2",
      "tail - 1, wrapping only when the array is full",
    ],
    correctAnswer: 0,
    explanation:
      "Modulo capacity wraps the next position to index zero when the tail reaches the final array slot.",
    difficulty: "hard",
    misconceptionTags: {
      1: {
        tag: "wraparound-without-modulo",
        explanation:
          "Adding capacity moves beyond the array; modulo is what wraps the index into the valid range.",
      },
    },
  },
  {
    id: "trees-easy-root",
    topicId: "trees",
    text: "In a rooted tree, what is the root node?",
    options: [
      "A node with no parent",
      "A node with no children",
      "The node with the smallest value",
      "Every leaf node",
    ],
    correctAnswer: 0,
    explanation:
      "The root is the starting node of a rooted tree and has no parent. A leaf is defined by having no children.",
    difficulty: "easy",
    misconceptionTags: {
      1: {
        tag: "root-confused-with-leaf",
        explanation:
          "Having no children defines a leaf; the root is identified by having no parent.",
      },
    },
  },
  {
    id: "trees-easy-leaf",
    topicId: "trees",
    text: "What makes a node a leaf in a tree?",
    options: [
      "It has no children",
      "It has no parent",
      "It is always the root",
      "It has the smallest key",
    ],
    correctAnswer: 0,
    explanation:
      "A leaf is a node with no children. A root is identified by having no parent.",
    difficulty: "easy",
    misconceptionTags: {
      1: {
        tag: "leaf-confused-with-root",
        explanation:
          "Having no parent defines the root. A leaf is identified by having no children.",
      },
    },
  },
  {
    id: "trees-medium-inorder",
    topicId: "trees",
    text: "For a binary search tree, what order does an inorder traversal visit the values in when the tree's ordering invariant is valid?",
    options: [
      "Ascending order",
      "Descending order in every tree",
      "Level by level",
      "Insertion order",
    ],
    correctAnswer: 0,
    explanation:
      "Inorder visits the left subtree, node, then right subtree. The BST ordering invariant therefore yields ascending values.",
    difficulty: "medium",
    misconceptionTags: {
      2: {
        tag: "inorder-confused-with-level-order",
        explanation:
          "Level-by-level traversal is breadth-first traversal, not inorder depth-first traversal.",
      },
    },
  },
  {
    id: "trees-hard-balanced-search",
    topicId: "trees",
    text: "A balanced binary search tree contains n keys. What is the expected worst-case lookup complexity when balance is maintained?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: 1,
    explanation:
      "A balanced tree has height proportional to log n, and lookup follows at most one root-to-leaf path.",
    difficulty: "hard",
    misconceptionTags: {
      2: {
        tag: "balanced-tree-height-ignored",
        explanation:
          "A linear scan can take O(n), but a maintained balanced BST limits the search path to O(log n) height.",
      },
      0: {
        tag: "tree-lookup-assumed-constant",
        explanation:
          "A tree lookup follows a path determined by comparisons; balance makes that path logarithmic, not constant.",
      },
    },
  },
];

export function getQuestionById(questionId: string): Question | undefined {
  return questionBank.find((question) => question.id === questionId);
}

export function getQuestionForTopic(
  topicId: TopicId,
  difficulty: Difficulty,
  excludedQuestionIds: readonly string[],
): Question | undefined {
  const topicQuestions = questionBank.filter(
    (question) => question.topicId === topicId,
  );
  return (
    topicQuestions.find(
      (question) =>
        question.difficulty === difficulty &&
        !excludedQuestionIds.includes(question.id),
    ) ??
    topicQuestions.find(
      (question) => !excludedQuestionIds.includes(question.id),
    ) ??
    topicQuestions.find((question) => question.difficulty === difficulty) ??
    topicQuestions[0]
  );
}
