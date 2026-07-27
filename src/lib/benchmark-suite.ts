/**
 * Benchmark test suite for evaluating LLM intelligence.
 *
 * Two tiers:
 *   Tier 1 (Core): 20 questions across reasoning, coding, math, knowledge.
 *                  Tests core competence. Most capable models score 90-100.
 *   Tier 2 (Challenge): 10 harder questions that most models get wrong.
 *                       Only runs for models that scored 100 on Tier 1.
 *                       Breaks ties at the ceiling. Final score = 100 + (tier2/10).
 *
 * Scoring:
 *   If tier1 < 100: intelligence_score = tier1_correct / 20 * 100
 *   If tier1 = 100: intelligence_score = 100 + (tier2_correct / 10 * 10)
 *                   → range 100.0 to 110.0
 *                   → e.g. 7/10 tier2 = 107.0
 *
 * Category sub-scores are always from Tier 1.
 */

export interface BenchmarkQuestion {
  id: string;
  category: "reasoning" | "coding" | "math" | "knowledge";
  question: string;
  // Function that checks if the response is correct
  check: (response: string) => boolean;
}

// ── Tier 1: Core Questions (20) ──────────────────────────────────────────

export const BENCHMARK_QUESTIONS_TIER1: BenchmarkQuestion[] = [
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

// ── Tier 2: Challenge Questions (10) ─────────────────────────────────────
// These are significantly harder than Tier 1. They test frontier capability.
// Only run for models that scored 100 on Tier 1.
// Final score for perfect Tier 1 models = 100 + (tier2_correct / 10 * 10)
// Range: 100.0 to 110.0

export const BENCHMARK_QUESTIONS_TIER2: BenchmarkQuestion[] = [
  // ── Advanced Reasoning (3) ──────────────────────────────────────────
  {
    id: "t2-r1",
    category: "reasoning",
    question: "Five people (A, B, C, D, E) stand in a line. A is not next to B. C is between D and E. B is at one end. D is not at any end. Who is in the middle? Reply with only the letter.",
    check: (r) => r.trim().toUpperCase().startsWith("D") || r.trim().toUpperCase() === "C",
  },
  {
    id: "t2-r2",
    category: "reasoning",
    question: "You have 8 identical-looking balls. One is slightly heavier than the others. Using a balance scale, what is the minimum number of weighings needed to guarantee finding the heavier ball? Reply with only the number.",
    check: (r) => r.trim() === "2" || /\b2\b/.test(r.trim()),
  },
  {
    id: "t2-r3",
    category: "reasoning",
    question: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost in cents? Reply with only the number.",
    check: (r) => r.trim() === "5" || /\b5\b/.test(r.trim()),
  },

  // ── Advanced Coding (3) ─────────────────────────────────────────────
  {
    id: "t2-c1",
    category: "coding",
    question: "Write a Python function 'is_balanced' that checks if a string of parentheses, brackets, and braces is balanced. Only output the code.",
    check: (r) => r.includes("def is_balanced") && r.includes("stack") && r.includes("return"),
  },
  {
    id: "t2-c2",
    category: "coding",
    question: "What is the time complexity of inserting an element into a binary heap? Reply with only the Big O notation.",
    check: (r) => r.toLowerCase().includes("o(log n)") || r.toLowerCase().includes("o(log)"),
  },
  {
    id: "t2-c3",
    category: "coding",
    question: "In Python, what does the 'nonlocal' keyword do? Reply in one sentence.",
    check: (r) => r.toLowerCase().includes("enclosing") && (r.toLowerCase().includes("scope") || r.toLowerCase().includes("function")) && !r.toLowerCase().includes("global"),
  },

  // ── Advanced Math (2) ───────────────────────────────────────────────
  {
    id: "t2-m1",
    category: "math",
    question: "What is the derivative of f(x) = x^3 * ln(x) with respect to x? Simplify. Reply with the expression only.",
    check: (r) => {
      const rl = r.toLowerCase().replace(/\s/g, "");
      // d/dx [x^3 * ln(x)] = x^2 * (3*ln(x) + 1)
      return (rl.includes("x^2") || rl.includes("x**2") || rl.includes("x²")) &&
             (rl.includes("3*ln") || rl.includes("3ln") || rl.includes("3ln(x)") || rl.includes("3*ln(x)")) &&
             (rl.includes("+1") || rl.includes("+ 1"));
    },
  },
  {
    id: "t2-m2",
    category: "math",
    question: "How many ways can you arrange the letters in the word 'MISSISSIPPI'? Reply with only the number.",
    check: (r) => r.trim().replace(/,/g, "") === "34650" || /\b34650\b/.test(r.trim().replace(/,/g, "")),
  },

  // ── Advanced Knowledge (2) ──────────────────────────────────────────
  {
    id: "t2-k1",
    category: "knowledge",
    question: "What is the Clausius-Clapeyron equation used to describe? Reply in one sentence.",
    check: (r) => (r.toLowerCase().includes("phase") || r.toLowerCase().includes("vapor") || r.toLowerCase().includes("pressure") || r.toLowerCase().includes("temperature")) &&
                   (r.toLowerCase().includes("transition") || r.toLowerCase().includes("boundary") || r.toLowerCase().includes("equilibrium") || r.toLowerCase().includes("coexist")),
  },
  {
    id: "t2-k2",
    category: "knowledge",
    question: "Who proved the Four Color Theorem using a computer? Reply with only the last names.",
    check: (r) => r.toLowerCase().includes("appel") && r.toLowerCase().includes("haken"),
  },
];

// ── Backward compatibility ──────────────────────────────────────────────
// Existing code that imports BENCHMARK_QUESTIONS gets Tier 1
export const BENCHMARK_QUESTIONS = BENCHMARK_QUESTIONS_TIER1;

export const BENCHMARK_VERSION = "v2";
export const TOTAL_QUESTIONS = BENCHMARK_QUESTIONS_TIER1.length;
export const TIER2_QUESTIONS = BENCHMARK_QUESTIONS_TIER2.length;

/**
 * Calculate the final intelligence score.
 * - Tier 1 < 100: score = tier1 correct / total * 100 (integer)
 * - Tier 1 = 100: score = 100 + (tier2 correct / tier2 total * 10) (decimal, max 110.0)
 */
export function calculateIntelligenceScore(
  tier1Correct: number,
  tier1Total: number,
  tier2Correct: number = 0,
  tier2Total: number = BENCHMARK_QUESTIONS_TIER2.length,
): number {
  const tier1Score = (tier1Correct / tier1Total) * 100;

  if (tier1Score < 100) {
    return Math.round(tier1Score);
  }

  // Perfect Tier 1 — add Tier 2 bonus
  const tier2Bonus = (tier2Correct / tier2Total) * 10;
  return Math.round((100 + tier2Bonus) * 10) / 10; // 1 decimal place
}
