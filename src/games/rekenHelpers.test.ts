import { describe, it, expect } from 'vitest';
import {
  GROEPEN,
  configForGroep,
  generateProblem,
  REKEN_STICKER_DEFS,
  evaluateStickers,
  type RekenStats,
} from './rekenHelpers';

// Deterministische rng-helper: levert achtereenvolgens de gegeven waarden.
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('configForGroep', () => {
  it('geeft de juiste config per groep', () => {
    expect(configForGroep(3).addMax).toBe(20);
    expect(configForGroep(8).groep).toBe(8);
  });
  it('valt terug op groep 3 bij een onbekende groep', () => {
    expect(configForGroep(99).groep).toBe(3);
  });
});

describe('generateProblem', () => {
  it('groep 3: alleen plus/min, antwoord klopt en binnen grens', () => {
    for (let i = 0; i < 300; i++) {
      const p = generateProblem(3);
      expect(['+', '-']).toContain(p.op);
      if (p.op === '+') {
        expect(p.a + p.b).toBe(p.answer);
        expect(p.answer).toBeLessThanOrEqual(20);
      } else {
        expect(p.a - p.b).toBe(p.answer);
        expect(p.answer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('plus: a=0,b=0 bij rng=0', () => {
    const p = generateProblem(3, seq([0, 0, 0]));
    expect(p.op).toBe('+');
    expect(p.answer).toBe(0);
  });

  it('groep 4: kan keer bevatten, geen delen', () => {
    let sawTimes = false;
    for (let i = 0; i < 400; i++) {
      const p = generateProblem(4);
      expect(p.op).not.toBe('÷');
      if (p.op === '×') { sawTimes = true; expect(p.a * p.b).toBe(p.answer); }
    }
    expect(sawTimes).toBe(true);
  });

  it('groep 5: delen heeft altijd een hele uitkomst', () => {
    let sawDiv = false;
    for (let i = 0; i < 600; i++) {
      const p = generateProblem(5);
      if (p.op === '÷') {
        sawDiv = true;
        expect(p.b).toBeGreaterThanOrEqual(2);
        expect(p.a % p.b).toBe(0);
        expect(p.a / p.b).toBe(p.answer);
      }
    }
    expect(sawDiv).toBe(true);
  });

  it('groep 6: keer is 2-cijferig × 1-cijferig en antwoord klopt', () => {
    for (let i = 0; i < 400; i++) {
      const p = generateProblem(6);
      if (p.op === '×') {
        expect(p.a).toBeGreaterThanOrEqual(11);
        expect(p.a * p.b).toBe(p.answer);
      }
    }
  });

  it('alle groepen: minsom nooit negatief', () => {
    for (const g of GROEPEN) {
      for (let i = 0; i < 100; i++) {
        const p = generateProblem(g.groep);
        if (p.op === '-') expect(p.answer).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('evaluateStickers', () => {
  const base: RekenStats = { correct: 0, bestStreak: 0 };

  it('eerste goed en mijlpalen', () => {
    expect(evaluateStickers({ ...base, correct: 1 })).toContain('first_correct');
    expect(evaluateStickers({ ...base, correct: 10 })).toContain('correct_10');
    expect(evaluateStickers({ ...base, correct: 25 })).toContain('correct_25');
    expect(evaluateStickers({ ...base, correct: 50 })).toContain('correct_50');
  });
  it('streaks', () => {
    expect(evaluateStickers({ ...base, bestStreak: 5 })).toContain('streak_5');
    expect(evaluateStickers({ ...base, bestStreak: 10 })).toContain('streak_10');
  });
  it('tempo-mijlpalen', () => {
    expect(evaluateStickers({ ...base, tempoBest: 10 })).toContain('tempo_10');
    expect(evaluateStickers({ ...base, tempoBest: 20 })).toContain('tempo_20');
    expect(evaluateStickers({ ...base, tempoBest: 9 })).not.toContain('tempo_10');
  });
  it('groep 8 held', () => {
    expect(evaluateStickers({ ...base, maxGroep: 8 })).toContain('groep8');
    expect(evaluateStickers({ ...base, maxGroep: 7 })).not.toContain('groep8');
  });
  it('elke verdiende id bestaat in REKEN_STICKER_DEFS', () => {
    const ids = new Set(REKEN_STICKER_DEFS.map(s => s.id));
    const earned = evaluateStickers({ correct: 50, bestStreak: 10, tempoBest: 20, maxGroep: 8 });
    for (const id of earned) expect(ids.has(id)).toBe(true);
  });
});
