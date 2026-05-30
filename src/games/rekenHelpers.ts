// Pure reken-logica voor het Rekenspel — geen DOM, los te testen.

export type Op = '+' | '-' | '×';

export interface Problem {
  a: number;
  b: number;
  op: Op;
  answer: number;
}

export interface LevelConfig {
  name: string;
  ops: Op[];
  maxNum: number;
  tables: number[];
}

// Oplopende niveaus: van eenvoudige plus/min tot tafels en grotere getallen.
export const LEVELS: LevelConfig[] = [
  { name: 'Start', ops: ['+', '-'], maxNum: 10, tables: [] },
  { name: 'Groei', ops: ['+', '-'], maxNum: 20, tables: [] },
  { name: 'Tafels', ops: ['+', '-', '×'], maxNum: 20, tables: [1, 2, 3, 4, 5] },
  { name: 'Held', ops: ['+', '-', '×'], maxNum: 100, tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
];

/** Houdt een niveau-index binnen de geldige grenzen. */
export function clampLevel(level: number): number {
  return Math.max(0, Math.min(LEVELS.length - 1, level));
}

/**
 * Maakt een som voor het gegeven niveau. `rng` is injecteerbaar voor tests.
 * Aftrekken geeft nooit een negatief antwoord; optellen blijft <= maxNum.
 */
export function generateProblem(level: number, rng: () => number = Math.random): Problem {
  const cfg = LEVELS[clampLevel(level)];
  const op = cfg.ops[Math.floor(rng() * cfg.ops.length)];

  if (op === '×') {
    const t = cfg.tables[Math.floor(rng() * cfg.tables.length)];
    const b = Math.floor(rng() * 10) + 1; // 1..10
    return { a: t, b, op, answer: t * b };
  }

  if (op === '+') {
    const a = Math.floor(rng() * (cfg.maxNum + 1));
    const b = Math.floor(rng() * (cfg.maxNum - a + 1)); // a + b <= maxNum
    return { a, b, op, answer: a + b };
  }

  // '-'
  const a = Math.floor(rng() * (cfg.maxNum + 1));
  const b = Math.floor(rng() * (a + 1)); // b <= a, dus answer >= 0
  return { a, b, op, answer: a - b };
}

/** Elke 5 goede antwoorden op rij gaat het niveau omhoog (tot het maximum). */
export function nextLevelAfterCorrect(level: number, streak: number): number {
  if (streak > 0 && streak % 5 === 0) return clampLevel(level + 1);
  return clampLevel(level);
}

export interface RekenStickerDef {
  id: string;
  emoji: string;
  name: string;
}

export const REKEN_STICKER_DEFS: RekenStickerDef[] = [
  { id: 'first_correct', emoji: '✅', name: 'Eerste Goed' },
  { id: 'correct_10', emoji: '🔢', name: 'Rekenkanjer' },
  { id: 'correct_25', emoji: '🧮', name: 'Rekenbaas' },
  { id: 'correct_50', emoji: '🎓', name: 'Rekenprofessor' },
  { id: 'streak_5', emoji: '🔥', name: 'Op Dreef' },
  { id: 'streak_10', emoji: '⚡', name: 'Bliksembrein' },
  { id: 'max_level', emoji: '🚀', name: 'Hoogste Niveau' },
];

export interface RekenStats {
  correct: number;
  bestStreak: number;
  maxLevel: number;
}

/** Bepaalt welke sticker-ids verdiend zijn op basis van de statistieken. */
export function evaluateStickers(s: RekenStats): string[] {
  const earned: string[] = [];
  if (s.correct >= 1) earned.push('first_correct');
  if (s.correct >= 10) earned.push('correct_10');
  if (s.correct >= 25) earned.push('correct_25');
  if (s.correct >= 50) earned.push('correct_50');
  if (s.bestStreak >= 5) earned.push('streak_5');
  if (s.bestStreak >= 10) earned.push('streak_10');
  if (s.maxLevel >= LEVELS.length - 1) earned.push('max_level');
  return earned;
}
