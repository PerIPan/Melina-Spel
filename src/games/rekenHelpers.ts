// Pure reken-logica voor het Rekenspel — geen DOM, los te testen.
// Moeilijkheid per groep is afgeleid van de NL basisschool-leerlijn rekenen.
// Antwoorden blijven hele getallen (je tikt ze in); breuken/procenten/komma's
// uit groep 6-8 worden bewust weggelaten.

export type Op = '+' | '-' | '×' | '÷';

export interface Problem {
  a: number;
  b: number;
  op: Op;
  answer: number;
}

export type MulKind = 'none' | 'tables' | '2x1' | '2x2';

export interface GroepConfig {
  groep: number;       // 3..8
  label: string;       // "Groep 3"
  ops: Op[];
  addMax: number;      // grens voor + en -
  tables: number[];    // beschikbare maaltafels
  mulKind: MulKind;    // soort vermenigvuldiging
  div: boolean;        // delen aan/uit
  divMax: number;      // grens voor deler en quotiënt
}

export const GROEPEN: GroepConfig[] = [
  { groep: 3, label: 'Groep 3', ops: ['+', '-'], addMax: 20, tables: [], mulKind: 'none', div: false, divMax: 0 },
  { groep: 4, label: 'Groep 4', ops: ['+', '-', '×'], addMax: 100, tables: [1, 2, 3, 4, 5, 10], mulKind: 'tables', div: false, divMax: 0 },
  { groep: 5, label: 'Groep 5', ops: ['+', '-', '×', '÷'], addMax: 1000, tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], mulKind: 'tables', div: true, divMax: 10 },
  { groep: 6, label: 'Groep 6', ops: ['+', '-', '×', '÷'], addMax: 10000, tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], mulKind: '2x1', div: true, divMax: 10 },
  { groep: 7, label: 'Groep 7', ops: ['+', '-', '×', '÷'], addMax: 100000, tables: [], mulKind: '2x2', div: true, divMax: 12 },
  { groep: 8, label: 'Groep 8', ops: ['+', '-', '×', '÷'], addMax: 1000000, tables: [], mulKind: '2x2', div: true, divMax: 12 },
];

/** Config voor een groep; valt terug op groep 3 bij een onbekende waarde. */
export function configForGroep(groep: number): GroepConfig {
  return GROEPEN.find(g => g.groep === groep) ?? GROEPEN[0];
}

/** Geheel getal in [min, max] (inclusief), met injecteerbare rng. */
function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Maakt een som voor de gegeven groep. `rng` is injecteerbaar voor tests.
 * Aftrekken geeft nooit negatief; delen heeft altijd een hele uitkomst.
 */
export function generateProblem(groep: number, rng: () => number = Math.random): Problem {
  const cfg = configForGroep(groep);
  const op = cfg.ops[Math.floor(rng() * cfg.ops.length)];

  if (op === '+') {
    const a = randInt(rng, 0, cfg.addMax);
    const b = randInt(rng, 0, cfg.addMax - a);
    return { a, b, op, answer: a + b };
  }

  if (op === '-') {
    const a = randInt(rng, 0, cfg.addMax);
    const b = randInt(rng, 0, a);
    return { a, b, op, answer: a - b };
  }

  if (op === '×') {
    if (cfg.mulKind === 'tables') {
      const t = cfg.tables[Math.floor(rng() * cfg.tables.length)];
      const b = randInt(rng, 1, 10);
      return { a: t, b, op, answer: t * b };
    }
    if (cfg.mulKind === '2x1') {
      const a = randInt(rng, 11, 99);
      const b = randInt(rng, 2, 9);
      return { a, b, op, answer: a * b };
    }
    // 2x2 (bescheiden getallen, blijft te doen)
    const a = randInt(rng, 11, 40);
    const b = randInt(rng, 11, 40);
    return { a, b, op, answer: a * b };
  }

  // '÷' — hele uitkomst: deler d, quotiënt q, deeltal = d*q
  const d = randInt(rng, 2, cfg.divMax);
  const q = randInt(rng, 1, cfg.divMax);
  return { a: d * q, b: d, op, answer: q };
}

/** Tempo rekenen (zoals op school in NL): zoveel mogelijk goed binnen de tijd. */
export const TEMPO_SECONDS = 60;

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
  { id: 'tempo_10', emoji: '⏱️', name: 'Tempo Tien' },
  { id: 'tempo_20', emoji: '🏁', name: 'Tempo Twintig' },
  { id: 'groep8', emoji: '🚀', name: 'Groep 8 Held' },
];

export interface RekenStats {
  correct: number;
  bestStreak: number;
  tempoBest?: number;
  maxGroep?: number;
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
  if ((s.tempoBest ?? 0) >= 10) earned.push('tempo_10');
  if ((s.tempoBest ?? 0) >= 20) earned.push('tempo_20');
  if ((s.maxGroep ?? 0) >= 8) earned.push('groep8');
  return earned;
}
