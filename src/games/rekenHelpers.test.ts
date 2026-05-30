import { describe, it, expect } from 'vitest';
import {
  LEVELS,
  clampLevel,
  generateProblem,
  nextLevelAfterCorrect,
  REKEN_STICKER_DEFS,
  evaluateStickers,
  type RekenStats,
} from './rekenHelpers';

// Deterministische rng-helper: levert achtereenvolgens de gegeven waarden.
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('clampLevel', () => {
  it('blijft binnen 0..LEVELS.length-1', () => {
    expect(clampLevel(-5)).toBe(0);
    expect(clampLevel(0)).toBe(0);
    expect(clampLevel(99)).toBe(LEVELS.length - 1);
  });
});

describe('generateProblem', () => {
  it('plus: antwoord klopt en blijft binnen maxNum', () => {
    // rng=0 -> op index 0 ('+'), a=0, b=0
    const p = generateProblem(0, seq([0, 0, 0]));
    expect(p.op).toBe('+');
    expect(p.a + p.b).toBe(p.answer);
    expect(p.a + p.b).toBeLessThanOrEqual(LEVELS[0].maxNum);
  });

  it('min: antwoord is nooit negatief', () => {
    // 1000 willekeurige minsommen op niveau 1 (heeft + en -)
    for (let i = 0; i < 200; i++) {
      const p = generateProblem(1);
      if (p.op === '-') {
        expect(p.answer).toBeGreaterThanOrEqual(0);
        expect(p.a - p.b).toBe(p.answer);
      }
    }
  });

  it('keer: alleen op niveaus met tafels, antwoord klopt', () => {
    let sawTimes = false;
    for (let i = 0; i < 300; i++) {
      const p = generateProblem(3);
      if (p.op === '×') {
        sawTimes = true;
        expect(p.a * p.b).toBe(p.answer);
      }
    }
    expect(sawTimes).toBe(true);
  });

  it('niveau 0 bevat nooit keersommen', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateProblem(0).op).not.toBe('×');
    }
  });
});

describe('nextLevelAfterCorrect', () => {
  it('verhoogt het niveau elke 5 goede op rij', () => {
    expect(nextLevelAfterCorrect(0, 5)).toBe(1);
    expect(nextLevelAfterCorrect(1, 10)).toBe(2);
  });
  it('verandert niets bij een niet-veelvoud van 5', () => {
    expect(nextLevelAfterCorrect(1, 3)).toBe(1);
    expect(nextLevelAfterCorrect(1, 0)).toBe(1);
  });
  it('gaat niet voorbij het maximale niveau', () => {
    expect(nextLevelAfterCorrect(LEVELS.length - 1, 5)).toBe(LEVELS.length - 1);
  });
});

describe('evaluateStickers', () => {
  const base: RekenStats = { correct: 0, bestStreak: 0, maxLevel: 0 };

  it('eerste goed', () => {
    expect(evaluateStickers({ ...base, correct: 1 })).toContain('first_correct');
  });
  it('mijlpalen op aantal goed', () => {
    expect(evaluateStickers({ ...base, correct: 10 })).toContain('correct_10');
    expect(evaluateStickers({ ...base, correct: 25 })).toContain('correct_25');
    expect(evaluateStickers({ ...base, correct: 50 })).toContain('correct_50');
  });
  it('streaks', () => {
    expect(evaluateStickers({ ...base, bestStreak: 5 })).toContain('streak_5');
    expect(evaluateStickers({ ...base, bestStreak: 10 })).toContain('streak_10');
  });
  it('max niveau bereikt', () => {
    expect(evaluateStickers({ ...base, maxLevel: LEVELS.length - 1 })).toContain('max_level');
    expect(evaluateStickers({ ...base, maxLevel: 0 })).not.toContain('max_level');
  });
  it('elke verdiende id bestaat in REKEN_STICKER_DEFS', () => {
    const ids = new Set(REKEN_STICKER_DEFS.map(s => s.id));
    const earned = evaluateStickers({ correct: 50, bestStreak: 10, maxLevel: LEVELS.length - 1 });
    for (const id of earned) expect(ids.has(id)).toBe(true);
  });
});
