import { describe, it, expect } from 'vitest';
import {
  PALETTE,
  nextRainbowHue,
  hueToHex,
  STICKER_DEFS,
  evaluateStickers,
  type DrawStats,
} from './drawHelpers';

describe('PALETTE', () => {
  it('heeft minstens 10 unieke kleuren', () => {
    expect(PALETTE.length).toBeGreaterThanOrEqual(10);
    expect(new Set(PALETTE).size).toBe(PALETTE.length);
  });
  it('bevat alleen geldige hex-kleuren', () => {
    for (const c of PALETTE) expect(c).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('nextRainbowHue', () => {
  it('verhoogt de hue met de stap en blijft binnen 0-359', () => {
    expect(nextRainbowHue(0, 10)).toBe(10);
    expect(nextRainbowHue(355, 10)).toBe(5);
    expect(nextRainbowHue(359, 1)).toBe(0);
  });
});

describe('hueToHex', () => {
  it('geeft een geldige hex terug', () => {
    expect(hueToHex(0)).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(hueToHex(120)).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe('evaluateStickers', () => {
  const base: DrawStats = {
    strokes: 0,
    rainbowUsed: false,
    colorsUsed: [],
    stampsPlaced: 0,
    drawingsSaved: 0,
    coloringPagesSaved: 0,
  };

  it('geeft first_draw na eerste streek', () => {
    const earned = evaluateStickers({ ...base, strokes: 1 });
    expect(earned).toContain('first_draw');
  });
  it('geeft rainbow_used wanneer regenboog gebruikt is', () => {
    expect(evaluateStickers({ ...base, rainbowUsed: true })).toContain('rainbow_used');
  });
  it('geeft all_colors wanneer alle paletkleuren gebruikt zijn', () => {
    const earned = evaluateStickers({ ...base, colorsUsed: [...PALETTE] });
    expect(earned).toContain('all_colors');
  });
  it('geeft all_colors NIET bij ontbrekende kleur', () => {
    const earned = evaluateStickers({ ...base, colorsUsed: PALETTE.slice(1) });
    expect(earned).not.toContain('all_colors');
  });
  it('geeft stamp_fan vanaf 10 stempels', () => {
    expect(evaluateStickers({ ...base, stampsPlaced: 10 })).toContain('stamp_fan');
    expect(evaluateStickers({ ...base, stampsPlaced: 9 })).not.toContain('stamp_fan');
  });
  it('geeft saved_5 vanaf 5 opgeslagen tekeningen', () => {
    expect(evaluateStickers({ ...base, drawingsSaved: 5 })).toContain('saved_5');
  });
  it('geeft first_coloring na eerste opgeslagen kleurplaat', () => {
    expect(evaluateStickers({ ...base, coloringPagesSaved: 1 })).toContain('first_coloring');
  });
  it('elke sticker-id bestaat in STICKER_DEFS', () => {
    const ids = new Set(STICKER_DEFS.map(s => s.id));
    const earned = evaluateStickers({
      strokes: 1, rainbowUsed: true, colorsUsed: [...PALETTE],
      stampsPlaced: 10, drawingsSaved: 5, coloringPagesSaved: 1,
    });
    for (const id of earned) expect(ids.has(id)).toBe(true);
  });
});
