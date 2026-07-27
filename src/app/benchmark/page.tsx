import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Code, Calculator, BookOpen, CheckCircle2, GitBranch, Clock, Database, RefreshCw, ExternalLink, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Xilos Intelligence Benchmark — Open-Source LLM Evaluation",
  description: "An open, deterministic benchmark for evaluating LLM intelligence across reasoning, coding, math, and knowledge. 20 questions, 4 categories, transparent scoring.",
};

const categories = [
  {
    icon: Brain,
    name: "Reasoning",
    count: 5,
    color: "text-brand-600",
    bg: "bg-brand-50",
    description: "Logical deduction, sequence completion, spatial reasoning, and transitive logic. Tests the model's ability to follow chains of inference and avoid common reasoning traps.",
    examples: [
      "Syllogistic reasoning with invalid conclusions",
      "Classic riddles with counterintuitive answers",
      "Multi-step measurement problems",
      "Numeric sequence completion",
      "Transitive relationship deduction",
    ],
  },
  {
    icon: Code,
    name: "Coding",
    count: 5,
    color: "text-green-600",
    bg: "bg-green-50",
    description: "Code generation, algorithmic complexity analysis, SQL syntax, and version control concepts. Tests practical programming knowledge and code comprehension.",
    examples: [
      "Write a function with specific signature",
      "Identify Big-O time complexity",
      "Python list comprehension / flattening",
      "SQL keyword identification",
      "Git command explanation",
    ],
  },
  {
    icon: Calculator,
    name: "Math",
    count: 5,
    color: "text-amber-600",
    bg: "bg-amber-50",
    description: "Arithmetic, algebra, geometry, number theory, and combinatorics. Tests precise numerical computation without calculator assistance.",
    examples: [
      "Percentage calculation",
      "Linear equation solving",
      "Circle area computation",
      "Prime number counting",
      "Factorial computation",
    ],
  },
  {
    icon: BookOpen,
    name: "Knowledge",
    count: 5,
    color: "text-purple-600",
    bg: "bg-purple-50",
    description: "Geography, literature, chemistry, history, and astronomy. Tests factual recall and general world knowledge across domains.",
    examples: [
      "Capital city identification",
      "Literary author attribution",
      "Chemical symbol recall",
      "Historical date accuracy",
      "Astronomical fact recall",
    ],
  },
];

const methodology = [
  {
    icon: GitBranch,
    title: "Deterministic Checking",
    description: "Every question has a programmatic check function — no judge model, no human evaluation, no ambiguity. A response is either correct or incorrect, determined by deterministic string matching, regex, or keyword analysis.",
  },
  {
    icon: Clock,
    title: "Controlled Conditions",
    description: "All models are tested at temperature=0 (deterministic decoding) with max_tokens=200. No system prompt, no few-shot examples. Each model gets the same bare question and must answer on its own.",
  },
  {
    icon: RefreshCw,
    title: "Never Re-Run",
    description: "Once a model is benchmarked, its score is permanent. Models are only tested once — when they first appear in our database. This prevents score drift and keeps the benchmark reproducible.",
  },
  {
    icon: Database,
    title: "Open Data",
    description: "All scores are stored in our public database and displayed on every model's entry in the model explorer. The test suite, scoring logic, and runner code are all open-source on GitHub.",
  },
];

export default function BenchmarkPage() {
  return (
    <>
      {/* Hero */}
        <section className="border-b border-gray-200 bg-gradient-to-br from-brand-50/50 via-white to-white">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="mb-3">
                <Brain className="mr-1 h-3 w-3" /> OPEN BENCHMARK
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
              The Xilos Intelligence Benchmark
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-600">
              An open, deterministic benchmark for evaluating LLM intelligence.
              20 questions across 4 categories. Transparent scoring. No judge model.
              Every model on Spotlight is tested — and the results are public.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/models">
                <span className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
                  Browse benchmarked models <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <a href="https://github.com/technicalmonk/spotlight" target="_blank" rel="noopener">
                <span className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gray-50">
                  <ExternalLink className="h-4 w-4" /> View source on GitHub
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-b border-gray-200 bg-ink-900">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div className="text-center">
                <p className="font-mono text-3xl font-bold text-white">20</p>
                <p className="text-xs text-gray-400">Questions</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-3xl font-bold text-white">4</p>
                <p className="text-xs text-gray-400">Categories</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-3xl font-bold text-white">0–100</p>
                <p className="text-xs text-gray-400">Score range</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-3xl font-bold text-white">v1</p>
                <p className="text-xs text-gray-400">Test version</p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-2 text-2xl font-bold text-ink-900">Test Categories</h2>
            <p className="mb-8 text-gray-500">
              The benchmark covers four core cognitive domains. Each category contains 5 questions
              designed to test a specific capability without ambiguity.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Card key={cat.name} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cat.bg}`}>
                          <Icon className={`h-5 w-5 ${cat.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-ink-900">{cat.name}</h3>
                          <p className="text-xs text-gray-500">{cat.count} questions</p>
                        </div>
                      </div>
                      <p className="mb-4 text-sm text-gray-600">{cat.description}</p>
                      <div className="space-y-1.5">
                        {cat.examples.map((ex, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300" />
                            <span>{ex}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Methodology */}
        <section className="border-y border-gray-200 bg-gray-50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-2 text-2xl font-bold text-ink-900">Methodology</h2>
            <p className="mb-8 text-gray-500">
              We designed the benchmark to be reproducible, transparent, and resistant to gaming.
              Here's how it works.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {methodology.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      <Icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-ink-900">{m.title}</h3>
                      <p className="text-sm text-gray-600">{m.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How scoring works */}
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-2 text-2xl font-bold text-ink-900">How Scoring Works</h2>
            <p className="mb-8 text-gray-500">
              The intelligence score is the percentage of correct answers across all 20 questions.
              Category sub-scores are calculated independently.
            </p>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="text-sm font-medium text-gray-700">Intelligence Score (overall)</span>
                    <code className="rounded bg-gray-100 px-3 py-1 text-xs text-ink-900">
                      (correct / 20) × 100
                    </code>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="text-sm font-medium text-gray-700">Category Score (e.g. Coding)</span>
                    <code className="rounded bg-gray-100 px-3 py-1 text-xs text-ink-900">
                      (correct_in_category / 5) × 100
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Decoding</span>
                    <code className="rounded bg-gray-100 px-3 py-1 text-xs text-ink-900">
                      temperature=0, max_tokens=200
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-brand-200 bg-brand-50/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                  <div>
                    <h3 className="mb-1 font-semibold text-ink-900">No judge model. No human eval.</h3>
                    <p className="text-sm text-gray-600">
                      Unlike many LLM benchmarks that use a second LLM as a judge (which introduces
                      bias and non-determinism), our benchmark uses programmatic check functions.
                      Each question has a <code className="rounded bg-white px-1.5 py-0.5 text-xs">check(response) → boolean</code>
                      {" "}function that deterministically verifies correctness. This means the same
                      response always gets the same score, every time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Testing procedure */}
        <section className="border-t border-gray-200 bg-gray-50 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-2 text-2xl font-bold text-ink-900">Testing Procedure</h2>
            <p className="mb-8 text-gray-500">
              Here's exactly what happens when a new model is benchmarked.
            </p>
            <ol className="space-y-4">
              {[
                {
                  step: "Discovery",
                  desc: "A new model appears in our database via the OpenRouter API sync (runs every 6 hours). The model gets flagged as unbenchmarked.",
                },
                {
                  step: "Selection",
                  desc: "The daily benchmark cron (9am UTC) picks up to 10 unbenchmarked models per run. Each model is tested only once — never re-run.",
                },
                {
                  step: "Questioning",
                  desc: "Each model receives all 20 questions one at a time via the OpenRouter chat completions API. Temperature is set to 0 (deterministic). Max tokens is 200. No system prompt. No few-shot examples. 500ms delay between questions.",
                },
                {
                  step: "Checking",
                  desc: "Each response is evaluated against its deterministic check function. The function returns true (correct) or false (incorrect). No partial credit.",
                },
                {
                  step: "Scoring",
                  desc: "Overall intelligence score and four category sub-scores (reasoning, coding, math, knowledge) are computed as percentage correct and stored in the model_benchmarks table.",
                },
                {
                  step: "Publication",
                  desc: "Scores appear immediately on the model's entry in the Spotlight model explorer. The intelligence column shows the overall score with a color-coded badge.",
                },
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-semibold text-ink-900">{item.step}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Open source CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="mb-3 text-2xl font-bold text-ink-900">Open-Source and Reproducible</h2>
            <p className="mb-8 text-gray-500">
              The entire benchmark system — test questions, check functions, scoring logic, and the
              runner that calls models via OpenRouter — is open-source. You can run it yourself,
              verify our scores, or propose new questions.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="https://github.com/technicalmonk/spotlight" target="_blank" rel="noopener">
                <span className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800">
                  <ExternalLink className="h-4 w-4" /> View on GitHub
                </span>
              </a>
              <Link href="/models">
                <span className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-gray-50">
                  See benchmarked models <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
            <p className="mt-6 text-xs text-gray-400">
              Test version: v1 · 20 questions · 4 categories · MIT License
            </p>
          </div>
        </section>

        {/* Competitive comparison */}
        <section className="border-t border-gray-200 bg-gray-50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-2 text-2xl font-bold text-ink-900">How We Compare to Other Benchmarks</h2>
            <p className="mb-8 text-gray-500">
              The LLM benchmark landscape is crowded. Here's how the Xilos Intelligence Benchmark
              differs from the major players — and why we built it.
            </p>

            {/* Comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left">
                    <th className="py-3 px-4 font-semibold text-gray-700">Benchmark</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Questions</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Categories</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Scoring Method</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Contamination Strategy</th>
                    <th className="py-3 px-4 font-semibold text-gray-700">Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="bg-brand-50 font-medium">
                    <td className="py-3 px-4 text-brand-700">Xilos Intelligence Benchmark</td>
                    <td className="py-3 px-4">20</td>
                    <td className="py-3 px-4">4 (Reasoning, Coding, Math, Knowledge)</td>
                    <td className="py-3 px-4">Deterministic check functions (no judge)</td>
                    <td className="py-3 px-4">Custom questions, never from public datasets</td>
                    <td className="py-3 px-4">337+ models via OpenRouter</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-ink-900">LiveBench</td>
                    <td className="py-3 px-4">~18 tasks</td>
                    <td className="py-3 px-4">7 (Reasoning, Coding, Agentic, Math, Data, Language, IF)</td>
                    <td className="py-3 px-4">Programmatic + objective ground truth</td>
                    <td className="py-3 px-4">Frequently updated with fresh real-world data</td>
                    <td className="py-3 px-4">~40 top models (curated)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-ink-900">Artificial Analysis Intelligence Index</td>
                    <td className="py-3 px-4">~3,000+</td>
                    <td className="py-3 px-4">4 (Agents, Coding, Scientific, General)</td>
                    <td className="py-3 px-4">Mixed: judge LLM, code execution, regex, Elo</td>
                    <td className="py-3 px-4">Multiple datasets, some periodically updated</td>
                    <td className="py-3 px-4">~40 frontier models (curated)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-ink-900">LMSYS Chatbot Arena</td>
                    <td className="py-3 px-4">Open-ended (user prompts)</td>
                    <td className="py-3 px-4">1 (human preference)</td>
                    <td className="py-3 px-4">Human pairwise voting → Elo rating</td>
                    <td className="py-3 px-4">Live user prompts (always fresh)</td>
                    <td className="py-3 px-4">100+ models (crowdsourced)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-ink-900">MMLU-Pro</td>
                    <td className="py-3 px-4">12,000</td>
                    <td className="py-3 px-4">14 subjects</td>
                    <td className="py-3 px-4">Multiple choice (10 options)</td>
                    <td className="py-3 px-4">Static dataset (contamination risk)</td>
                    <td className="py-3 px-4">~50 models (curated)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Our positioning */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="border-brand-200">
                <CardContent className="p-6">
                  <h3 className="mb-3 font-semibold text-ink-900">Our advantages</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span><strong>Scale of coverage:</strong> 337+ models benchmarked — 8x more than LiveBench or Artificial Analysis, which curate ~40 frontier models.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span><strong>Zero judge bias:</strong> No LLM-as-judge, no human eval. Every check is deterministic code. The same answer always gets the same score.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span><strong>Reproducible:</strong> Temperature=0, no system prompt, no few-shot. Anyone can run the exact same test and get the same result.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span><strong>Open and transparent:</strong> All questions, check functions, and scores are public. No proprietary grading pipeline.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <span><strong>Cost-integrated:</strong> Every score sits next to pricing data. Users see intelligence and cost together, not separated.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <h3 className="mb-3 font-semibold text-ink-900">Our trade-offs (honestly)</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                      <span><strong>Question count:</strong> 20 questions vs LiveBench's 18 tasks (with many sub-questions each) or MMLU-Pro's 12,000. Less statistical power per model.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                      <span><strong>Difficulty ceiling:</strong> Our questions test core competence, not frontier capability. Top models score 95-100, so the benchmark can't distinguish between GPT-5.6 Sol and Claude Fable 5 — both get 100. LiveBench and Artificial Analysis are better at discriminating at the top end.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                      <span><strong>No agentic tasks:</strong> We don't test tool use, multi-step reasoning, or agentic workflows. Artificial Analysis's Intelligence Index v4.1 weighs agents at 34%.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                      <span><strong>No instruction following:</strong> We don't test how well models follow complex formatting instructions. LiveBench has a dedicated IF category.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                      <span><strong>Static questions:</strong> Unlike LiveBench (which updates tasks with fresh data), our questions are fixed. Version 1 stays stable for reproducibility — new versions will add harder questions.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* When to use which */}
            <Card className="mt-6 bg-ink-900 text-white">
              <CardContent className="p-6">
                <h3 className="mb-3 font-semibold text-white">When to use which benchmark</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><span className="font-semibold text-white">Xilos Intelligence Benchmark:</span> When you need broad coverage (337+ models) and a quick, fair, reproducible intelligence signal. Best for cost-vs-intelligence comparisons across the entire model landscape.</p>
                  <p><span className="font-semibold text-white">LiveBench:</span> When you need contamination-free, frequently updated scores on frontier models with category-level discrimination.</p>
                  <p><span className="font-semibold text-white">Artificial Analysis Intelligence Index:</span> When you need a composite score weighted toward agentic capability and real-world knowledge work.</p>
                  <p><span className="font-semibold text-white">Chatbot Arena:</span> When you care about human preference and real-world conversational quality over objective correctness.</p>
                  <p><span className="font-semibold text-white">MMLU-Pro:</span> When you need deep, multi-domain academic knowledge evaluation at graduate level.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
    </>
  );
}
