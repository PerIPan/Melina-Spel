import type { TreeNode, AnimalRecord } from "../types";

/** Extract all animals from tree with their question→answer mappings */
export function extractAllAnimals(
  node: TreeNode,
  path: { question: string; answer: "yes" | "no" }[] = []
): AnimalRecord[] {
  if (node.type === "answer") {
    const answers: Record<string, "yes" | "no"> = {};
    for (const step of path) {
      answers[step.question] = step.answer;
    }
    return [{ animal: node.animal, emoji: node.emoji, answers }];
  }
  return [
    ...extractAllAnimals(node.yes, [...path, { question: node.text, answer: "yes" }]),
    ...extractAllAnimals(node.no, [...path, { question: node.text, answer: "no" }]),
  ];
}

/** Collect all unique questions from tree */
export function collectAllQuestions(node: TreeNode): string[] {
  if (node.type === "answer") return [];
  const set = new Set<string>();
  set.add(node.text);
  for (const q of collectAllQuestions(node.yes)) set.add(q);
  for (const q of collectAllQuestions(node.no)) set.add(q);
  return [...set];
}

/** Pick a random animal from the tree */
export function pickRandomAnimal(tree: TreeNode): AnimalRecord {
  const animals = extractAllAnimals(tree);
  return animals[Math.floor(Math.random() * animals.length)];
}

/** Answer a player's question about the secret animal using fuzzy matching */
export function answerQuestion(
  playerQuestion: string,
  secretAnimal: AnimalRecord,
  allQuestions: string[]
): { matchedQuestion: string | null; answer: "yes" | "no" | "not-sure" } {
  const normalized = playerQuestion.toLowerCase().trim();

  // Try exact match first
  for (const q of allQuestions) {
    if (q.toLowerCase() === normalized) {
      const ans = secretAnimal.answers[q];
      return { matchedQuestion: q, answer: ans ?? "not-sure" };
    }
  }

  // Fuzzy: find best substring match
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const q of allQuestions) {
    const qLower = q.toLowerCase();
    // Count shared words
    const playerWords = normalized.split(/\s+/);
    const qWords = qLower.split(/\s+/);
    const shared = playerWords.filter((w) => qWords.some((qw) => qw.includes(w) || w.includes(qw)));
    const score = shared.length / Math.max(playerWords.length, qWords.length);

    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestMatch = q;
    }
  }

  if (bestMatch) {
    const ans = secretAnimal.answers[bestMatch];
    return { matchedQuestion: bestMatch, answer: ans ?? "not-sure" };
  }

  return { matchedQuestion: null, answer: "not-sure" };
}
