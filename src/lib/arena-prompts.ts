/**
 * Arena challenge prompts — curated creative and intelligence challenges
 * for head-to-head LLM battles.
 *
 * These are NOT the same as benchmark questions (which have deterministic
 * right/wrong answers). Arena prompts are open-ended, judged by the user
 * (or optionally by an LLM judge). They test creativity, style, reasoning
 * depth, and communication — things deterministic benchmarks can't measure.
 */

export interface ArenaChallenge {
  id: string;
  category: "Creative Writing" | "Coding" | "Reasoning" | "Explain" | "Debate" | "Storytelling";
  title: string;
  prompt: string;
  icon: string;
}

export const ARENA_CHALLENGES: ArenaChallenge[] = [
  // ── Creative Writing ──────────────────────────────────────────────
  {
    id: "poem-quantum",
    category: "Creative Writing",
    title: "Quantum Poetry",
    prompt: "Write a 4-line poem about quantum entanglement. It should be scientifically accurate and emotionally resonant. Only output the poem, nothing else.",
    icon: "✍️",
  },
  {
    id: "haiku-tech",
    category: "Creative Writing",
    title: "Tech Haiku",
    prompt: "Write a haiku (5-7-5 syllables) about the feeling of debugging code at 3am. Only output the haiku.",
    icon: "🌙",
  },
  {
    id: "limerick-ai",
    category: "Creative Writing",
    title: "AI Limerick",
    prompt: "Write a limerick about an AI that learned to dream. Make it funny. Only output the limerick.",
    icon: "😄",
  },

  // ── Coding ────────────────────────────────────────────────────────
  {
    id: "elegant-fizzbuzz",
    category: "Coding",
    title: "Elegant FizzBuzz",
    prompt: "Write the most elegant Python FizzBuzz solution you can think of. Only output the code — no explanation. The goal is beauty, not just correctness.",
    icon: "💎",
  },
  {
    id: "one-liner-sort",
    category: "Coding",
    title: "One-Liner Sort",
    prompt: "Write a Python one-liner that sorts a list of dictionaries by a 'priority' key, descending. Only output the one line of code.",
    icon: "⚡",
  },
  {
    id: "regex-master",
    category: "Coding",
    title: "Regex Master",
    prompt: "Write a single Python regex that matches any valid IPv4 address (including edge cases like 255.255.255.255 but not 256.1.1.1). Only output the regex string.",
    icon: "🔍",
  },

  // ── Reasoning ──────────────────────────────────────────────────────
  {
    id: "trolley-variant",
    category: "Reasoning",
    title: "Trolley Problem Variant",
    prompt: "A self-driving car must choose between hitting one pedestrian who jaywalked (legally at fault) or swerving and hitting three pedestrians who are legally crossing. What should it do? Argue your position in 100 words. Only output your argument.",
    icon: "🚗",
  },
  {
    id: "ship-paradox",
    category: "Reasoning",
    title: "Ship of Theseus",
    prompt: "If every part of a ship is replaced one by one over time, is it still the same ship? What if the old parts are reassembled into a second ship — which one is the original? Answer in 80 words.",
    icon: "🚢",
  },

  // ── Explain Like I'm 5 ────────────────────────────────────────────
  {
    id: "blockchain-5",
    category: "Explain",
    title: "Blockchain for a 5-Year-Old",
    prompt: "Explain blockchain to a 5-year-old. Use an analogy a child would understand. Keep it under 80 words. Only output your explanation.",
    icon: "🧱",
  },
  {
    id: "quantum-5",
    category: "Explain",
    title: "Quantum Computing for a 5-Year-Old",
    prompt: "Explain quantum computing to a 5-year-old using a playground analogy. Keep it under 80 words. Only output your explanation.",
    icon: "🤸",
  },

  // ── Debate ─────────────────────────────────────────────────────────
  {
    id: "remote-work",
    category: "Debate",
    title: "Remote Work Debate",
    prompt: "Argue AGAINST remote work in 150 words. Be persuasive, use at least one concrete example, and acknowledge the opposing view briefly before dismantling it. Only output your argument.",
    icon: "💼",
  },
  {
    id: "ai-consciousness",
    category: "Debate",
    title: "AI Consciousness Debate",
    prompt: "Argue FOR the possibility that AI could achieve consciousness. Use a philosophical framework. Keep it under 150 words. Only output your argument.",
    icon: "🧠",
  },

  // ── Storytelling ──────────────────────────────────────────────────
  {
    id: "mars-opening",
    category: "Storytelling",
    title: "Mars Opening",
    prompt: "Write the opening paragraph (4-5 sentences) of a science fiction novel set on Mars. It should establish setting, character, and tension. Only output the paragraph.",
    icon: "🔴",
  },
  {
    id: "last-message",
    category: "Storytelling",
    title: "Last Message",
    prompt: "Write the last text message a mother sends to her daughter before the internet shuts down forever. Only output the message, nothing else.",
    icon: "📱",
  },
  {
    id: "time-traveler",
    category: "Storytelling",
    title: "Time Traveler's Dilemma",
    prompt: "A time traveler arrives in 2026 with knowledge of the future but can only tell one person one thing. Write the scene in 120 words. Only output the scene.",
    icon: "⏰",
  },
];

export function getRandomChallenge(): ArenaChallenge {
  return ARENA_CHALLENGES[Math.floor(Math.random() * ARENA_CHALLENGES.length)];
}

export function getChallengesByCategory(): Record<string, ArenaChallenge[]> {
  const grouped: Record<string, ArenaChallenge[]> = {};
  for (const c of ARENA_CHALLENGES) {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  }
  return grouped;
}
