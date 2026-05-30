import { describe, it, expect } from 'vitest';
import { COLORING_PAGES, buildSvgMarkup } from './coloringPages';

describe('COLORING_PAGES', () => {
  it('bevat minstens 6 kleurplaten', () => {
    expect(COLORING_PAGES.length).toBeGreaterThanOrEqual(6);
  });
  it('elke kleurplaat heeft id, naam, emoji en minstens 1 pad', () => {
    for (const p of COLORING_PAGES) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.emoji).toBeTruthy();
      expect(p.paths.length).toBeGreaterThanOrEqual(1);
    }
  });
  it('heeft unieke ids', () => {
    const ids = COLORING_PAGES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('buildSvgMarkup', () => {
  it('maakt geldige svg-markup met de paden en de meegegeven kleur', () => {
    const page = COLORING_PAGES[0];
    const svg = buildSvgMarkup(page, '#888888');
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 100 100"');
    expect(svg).toContain('#888888');
    expect(svg).toContain(page.paths[0]);
  });
});
