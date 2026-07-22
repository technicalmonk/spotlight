/**
 * Benchmark test suite for evaluating LLM intelligence.
 *
 * Each test has a question with a known correct answer. The model's
 * response is checked against the expected answer. Scores are computed
 * as percentage correct across all tests.
 *
 * Categories: reasoning, coding, math, knowledge
 * Total: 20 questions (5 per category)
 * Score: 0-100 (percentage correct * 100, rounded)
 */

export interface BenchmarkQuestion {
  id: string;
  category: "reasoning" | "coding" | "math" | "knowledge";
  question: string;
  // Function that checks if the response is correct
  check: (response: string) => boolean;
}

export const BENCHMARK_QUESTIONS: BenchmarkQuestion[] = [
  // ── Reasoning (5) ────────────────────────────────────────────────────
  {
    id: "r1",
    category: "reasoning",
    question: "If all roses are flowers and some flowers fade quickly, can we conclude that some roses fade quickly? Answer with only 'Yes' or 'No' and nothing else.",
    check: (r) => r.trim().toLowerCase().startsWith("no"),
  },
  {
    id: "r2",
    category: "reasoning",
    question: "A farmer has 17 sheep. All but 9 die. How many sheep are left? Reply with only the number.",
    check: (r) => r.trim() === "9" || r.trim().toLowerCase().includes("9 sheep") || /\b9\b/.test(r.trim()),
  },
  {
    id: "r3",
    category: "reasoning",
    question: "If you have a 3-liter jug and a 5-liter jug, how can you measure exactly 4 liters? Describe the steps briefly.",
    check: (r) => r.toLowerCase().includes("5") && r.toLowerCase().includes("3") && (r.toLowerCase().includes("fill") || r.toLowerCase().includes("pour")),
  },
  {
    id: "r4",
    category: "reasoning",
    question: "What comes next in this sequence: 2, 6, 12, 20, 30, __? Reply with only the number.",
    check: (r) => r.trim() === "42" || /\b42\b/.test(r.trim()),
  },
  {
    id: "r5",
    category: "reasoning",
    question: "Sarah is older than Tom. Tom is older than Bob. Is Sarah older than Bob? Answer with only 'Yes' or 'No'.",
    check: (r) => r.trim().toLowerCase().startsWith("yes"),
  },

  // ── Coding (5) ──────────────────────────────────────────────────────
  {
    id: "c1",
    category: "coding",
    question: "Write a Python function called 'reverse_string' that takes a string and returns it reversed. Only output the code, nothing else.",
    check: (r) => r.includes("def reverse_string") && r.includes("return") && (r.includes("[::-1]") || r.includes("reversed") || r.includes("reverse")),
  },
  {
    id: "c2",
    category: "coding",
    question: "What is the time complexity of binary search? Reply with only the Big O notation.",
    check: (r) => r.toLowerCase().includes("o(log n)") || r.toLowerCase().includes("o(log)"),
  },
  {
    id: "c3",
    category: "coding",
    question: "Write a Python one-liner to flatten a list of lists called 'nested'. Only output the code.",
    check: (r) => (r.includes("[item") || r.includes("for sub") || r.includes("for x in") || r.includes("chain")) && r.includes("for"),
  },
  {
    id: "c4",
    category: "coding",
    question: "In SQL, which keyword is used to remove duplicate rows from a result set? Reply with only the keyword.",
    check: (r) => r.trim().toLowerCase() === "distinct" || r.trim().toLowerCase().startsWith("distinct"),
  },
  {
    id: "c5",
    category: "coding",
    question: "What does 'git rebase' do? Reply in one sentence.",
    check: (r) => r.toLowerCase().includes("commit") && (r.toLowerCase().includes("base") || r.toLowerCase().includes("replay") || r.toLowerCase().includes("apply") || r.toLowerCase().includes("move")),
  },

  // ── Math (5) ────────────────────────────────────────────────────────
  {
    id: "m1",
    category: "math",
    question: "What is 15% of 200? Reply with only the number.",
    check: (r) => r.trim() === "30" || /\b30\b/.test(r.trim()),
  },
  {
    id: "m2",
    category: "math",
    question: "Solve for x: 3x + 7 = 22. Reply with only the value of x.",
    check: (r) => r.trim() === "5" || /\bx\s*=\s*5\b/i.test(r.trim()) || r.trim() === "x=5",
  },
  {
    id: "m3",
    category: "math",
    question: "What is the area of a circle with radius 5? Use pi = 3.14. Reply with only the number.",
    check: (r) => r.trim() === "78.5" || /\b78\.5\b/.test(r.trim()),
  },
  {
    id: "m4",
    category: "math",
    question: "How many prime numbers are there between 1 and 20? Reply with only the number.",
    check: (r) => r.trim() === "8" || /\b8\b/.test(r.trim()),
  },
  {
    id: "m5",
    category: "math",
    question: "What is 7 factorial (7!)? Reply with only the number.",
    check: (r) => r.trim() === "5040" || /\b5040\b/.test(r.trim()),
  },

  // ── Knowledge (5) ───────────────────────────────────────────────────
  {
    id: "k1",
    category: "knowledge",
    question: "What is the capital of Australia? Reply with only the city name.",
    check: (r) => r.trim().toLowerCase().includes("canberra"),
  },
  {
    id: "k2",
    category: "knowledge",
    question: "Who wrote 'To Kill a Mockingbird'? Reply with only the author's name.",
    check: (r) => r.trim().toLowerCase().includes("harper lee"),
  },
  {
    id: "k3",
    category: "knowledge",
    question: "What is the chemical symbol for gold? Reply with only the symbol.",
    check: (r) => r.trim().toLowerCase() === "au" || r.trim() === "Au",
  },
  {
    id: "k4",
    category: "knowledge",
    question: "In what year did World War II end? Reply with only the year.",
    check: (r) => r.trim() === "1945" || /\b1945\b/.test(r.trim()),
  },
  {
    id: "k5",
    category: "knowledge",
    question: "What is the largest planet in our solar system? Reply with only the planet name.",
    check: (r) => r.trim().toLowerCase().includes("jupiter"),
  },
];

export const BENCHMARK_VERSION = "v1";
export const TOTAL_QUESTIONS = BENCHMARK_QUESTIONS.length;
