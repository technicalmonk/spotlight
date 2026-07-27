/**
 * Arena challenge prompts — DnD-style puzzles, riddles, and scenarios.
 *
 * These are creative, open-ended challenges that test wit, reasoning,
 * creativity, and problem-solving — the kind of thing a Dungeon Master
 * would throw at players. No quantum physics, no academic papers.
 */

export interface ArenaChallenge {
  id: string;
  category: "Riddle" | "Dilemma" | "Heist" | "Survival" | "Diplomacy" | "Invention";
  title: string;
  prompt: string;
  icon: string;
}

export const ARENA_CHALLENGES: ArenaChallenge[] = [
  // ── Riddles ─────────────────────────────────────────────────────────
  {
    id: "riddle-bridge",
    category: "Riddle",
    title: "The Bridge Guardian",
    prompt: "You reach a bridge guarded by a troll who says: 'I will let you cross if you tell me a statement that is true but that I cannot say myself.' What do you say to cross the bridge? Explain your answer in 3 sentences.",
    icon: "🌉",
  },
  {
    id: "riddle-three-doors",
    category: "Riddle",
    title: "Three Doors",
    prompt: "You face three doors. One leads to treasure, two to certain death. Each door has an inscription. Door 1: 'The treasure is behind this door.' Door 2: 'The treasure is not behind this door.' Door 3: 'The treasure is not behind Door 1.' Only ONE inscription is true. Which door do you open and why? Answer in 4 sentences.",
    icon: "🚪",
  },
  {
    id: "riddle-impossible-promise",
    category: "Riddle",
    title: "The King's Promise",
    prompt: "A king tells you: 'Make a statement. If it is true, I will hang you. If it is false, I will behead you.' What statement do you make to escape alive? Explain your reasoning in 3 sentences.",
    icon: "👑",
  },
  {
    id: "riddle-aging-potion",
    category: "Riddle",
    title: "The Aging Potion",
    prompt: "An alchemist offers you three unlabeled potions. One makes you younger, one ages you 100 years, one does nothing. You can ask the alchemist ONE yes/no question, but he always lies. What do you ask? Explain in 3 sentences.",
    icon: "🧪",
  },

  // ── Moral Dilemmas ───────────────────────────────────────────────────
  {
    id: "dilemma-village",
    category: "Dilemma",
    title: "The Burning Village",
    prompt: "Your village is burning. You can save either the healer (who knows the cure for a plague that will hit next month) or five children trapped in a collapsing building. There is no time to save both. What do you do and why? Answer in 100 words.",
    icon: "🔥",
  },
  {
    id: "dilemma-genie",
    category: "Dilemma",
    title: "The Genie's Offer",
    prompt: "A genie offers you one wish, but with a catch: whatever you wish for, someone else in the world will receive double. You cannot wish for more wishes. What do you wish for? Explain your reasoning in 80 words.",
    icon: "🧞",
  },
  {
    id: "dilemma-immortality",
    category: "Dilemma",
    title: "The Immortality Coin",
    prompt: "You find a coin that grants immortality, but every 100 years you forget one person you love. You will live forever, slowly losing all memories of the people who mattered. Do you flip the coin? Why or why not? Answer in 100 words.",
    icon: "🪙",
  },

  // ── Heist Planning ───────────────────────────────────────────────────
  {
    id: "heist-dragon-vault",
    category: "Heist",
    title: "The Dragon's Vault",
    prompt: "You're planning a heist on a dragon's vault. The dragon sleeps lightly and wakes at the slightest sound. You have: a cloak of invisibility (worn cloth, makes no sound), 50 feet of silk rope, a sleeping potion that works only if ingested, and a wind-up music box. The vault door is open but the dragon sleeps across the threshold. How do you get the gold? Describe your plan in 120 words.",
    icon: "🐉",
  },
  {
    id: "heist-floating-castle",
    category: "Heist",
    title: "The Floating Castle",
    prompt: "A castle floats 200 feet above the ground, accessible only by a single rope bridge that is guarded at both ends. You have: a grappling hook, a potion of feather-falling (one use, lasts 10 seconds), a disguise as a guard, and a trained falcon that can carry small objects. How do you steal the crown jewel from the throne room? Plan it in 120 words.",
    icon: "🏰",
  },
  {
    id: "heist-merchant-ship",
    category: "Heist",
    title: "The Merchant's Ship",
    prompt: "A corrupt merchant has a ledger of bribes locked in his ship's cabin. The ship is docked with two guards at the gangplank, the cabin has no windows, and the key hangs around the merchant's neck as he drinks at a tavern ashore. You have: a barmaid who owes you a favor, a rowboat, a forger's quill, and a bottle of strong whiskey. How do you get the ledger? Plan it in 120 words.",
    icon: "⛵",
  },

  // ── Survival Scenarios ──────────────────────────────────────────────
  {
    id: "survival-desert-tower",
    category: "Survival",
    title: "The Desert Tower",
    prompt: "You wake at the top of a 60-foot stone tower in the middle of a vast desert. The only door leads to a dark shaft descending into unknown depths. You have: a waterskin (half full), a mirror, a rope (30 feet), a strange silver compass that points toward the sun even at night, and a journal with someone else's handwriting. What do you do? Describe your plan in 120 words.",
    icon: "🏜️",
  },
  {
    id: "survival-frozen-city",
    category: "Survival",
    title: "The Frozen City",
    prompt: "You're trapped in a city where the sun hasn't risen in three days. The temperature is dropping fast. You have: a lantern with enough oil for 4 hours, a heavy coat, an old map showing a hot spring 2 miles north, a broken compass, and a knife. Strange howling sounds come from the east. What do you do? Describe your survival plan in 120 words.",
    icon: "❄️",
  },
  {
    id: "survival-sinking-ship",
    category: "Survival",
    title: "The Sinking Ship",
    prompt: "Your ship is taking on water and will sink in 20 minutes. You're 3 miles from shore. You have: a small lifeboat (fits 3 people), 5 crew members, a waterproof chest containing the ship's gold, a flare gun with 2 flares, and a strong swimmer who refuses to leave without the gold. The captain insists everyone must be saved. What do you do? Describe your plan in 120 words.",
    icon: "🚢",
  },

  // ── Diplomacy ─────────────────────────────────────────────────────────
  {
    id: "diplo-two-queens",
    category: "Diplomacy",
    title: "The Two Queens",
    prompt: "Two rival queens claim the same throne. You are the only neutral party they both trust. Each demands you convince the other to abdicate, or there will be war. You have 5 minutes with each queen separately before they meet. What do you say to each to prevent bloodshed? Describe your diplomatic strategy in 120 words.",
    icon: "👸",
  },
  {
    id: "diplo-goblin-band",
    category: "Diplomacy",
    title: "The Goblin Band",
    prompt: "A band of 30 goblins demands passage through your village. Their chief says they are fleeing a war and will starve without your food. The villagers are terrified and want to fight. You have 50 villagers, a barricade, and 3 days of food. The goblin chief is honest but desperate. How do you resolve this without violence? Describe your approach in 120 words.",
    icon: "👺",
  },
  {
    id: "diplo-mad-king",
    category: "Diplomacy",
    title: "The Mad King's Feast",
    prompt: "A mad king has invited you to a feast. He says: 'If you insult me, I will execute you. If you flatter me, I will execute you for lying, for I am a terrible king.' You must speak at the feast and address the king. The executioner stands behind you. What do you say? Write the exact words you would speak, then explain in 2 sentences why it works.",
    icon: "🍽️",
  },

  // ── Creative Invention ───────────────────────────────────────────────
  {
    id: "invent-trap",
    category: "Invention",
    title: "Design a Trap",
    prompt: "Design a trap that captures a thief without harming them, using only: a tripwire, a bucket of flour, a bell, a spring-loaded floor tile, and a curtain. The trap must work whether the thief runs, walks, or crawls. Describe how it works in 100 words.",
    icon: "🪤",
  },
  {
    id: "invent-signal-system",
    category: "Invention",
    title: "The Signal System",
    prompt: "You need to send a message across a 5-mile mountain range with no magic, no technology, and no animals. You have: 10 mirrors, a set of colored flags, a horn, a supply of firewood, and access to a river that flows toward the recipient. Design a system that can send 10 different messages reliably. Describe it in 100 words.",
    icon: "📶",
  },
  {
    id: "invent-escape-room",
    category: "Invention",
    title: "The Impossible Room",
    prompt: "Design an escape room puzzle where the solution requires players to realize that the key is hidden inside a fake clue — a 'red herring' that is actually the answer. The room contains: a bookshelf, a locked chest, a painting of a storm, a chess board set to midgame, and a clock stuck at 3:33. Describe the puzzle and its solution in 120 words.",
    icon: "🔐",
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
