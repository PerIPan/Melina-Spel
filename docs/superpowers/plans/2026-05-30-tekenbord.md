# Tekenbord Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Een "Tekenbord"-spel toevoegen aan de Melina-hub: vrij tekenen, kleuren, regenboog-kwast, gum, undo, opslaan als PNG, stempels, kleurplaten en stickers — werkt met vinger (tablet) en muis.

**Architecture:** Eén zelfstandige React-component `DrawGame` met eigen CSS, conform de bestaande games (`SnakeGame`, `MemoryGame`). Pure logica (regenboogkleur-stappen, sticker-voorwaarden) en data (kleurplaten) staan in losse, los te testen modules. Integratie in `App.tsx` via het bestaande `Screen`-patroon en de stickermuur.

**Tech Stack:** React 19 + TypeScript, Vite 7, HTML5 Canvas + Pointer Events, Web Audio (`utils/sounds.ts`), `localStorage`. Tests met Vitest (nieuw toegevoegd, alleen voor pure logica).

**Werkdirectory:** alle paden zijn relatief aan `melina-spel/`. Branch: `feat/tekenbord`.

---

## File Structure

- Create: `src/games/coloringPages.ts` — kleurplaat-definities (naam, emoji, SVG-pad) + helper
- Create: `src/games/coloringPages.test.ts` — tests voor de kleurplaat-data
- Create: `src/games/drawHelpers.ts` — pure helpers: regenboogkleur, paletkleuren, sticker-voorwaarden
- Create: `src/games/drawHelpers.test.ts` — tests voor drawHelpers
- Create: `src/games/DrawGame.tsx` — de tekencomponent
- Create: `src/games/DrawGame.css` — opmaak
- Modify: `src/App.tsx` — `Screen`-union, game-kaart, render, stickermuur-sectie
- Modify: `package.json` — vitest devDependency + `test`-script
- Create: `vitest.config.ts` — vitest-config

---

## Task 1: Vitest-testinfra toevoegen

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Installeer vitest**

Run:
```bash
npm install -D vitest
```
Expected: vitest verschijnt in `devDependencies`, geen errors.

- [ ] **Step 2: Voeg test-script toe aan package.json**

In `package.json`, in `"scripts"`, voeg toe na de `"lint"`-regel:
```json
    "test": "vitest run",
```

- [ ] **Step 3: Maak vitest.config.ts**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Verifieer dat vitest draait (nog geen tests)**

Run: `npm test`
Expected: vitest start en meldt "No test files found" (exit 0) of vergelijkbaar — geen crash.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for unit tests"
```

---

## Task 2: drawHelpers — pure logica met tests

**Files:**
- Create: `src/games/drawHelpers.ts`
- Test: `src/games/drawHelpers.test.ts`

- [ ] **Step 1: Schrijf de falende tests**

Create `src/games/drawHelpers.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests, verifieer falen**

Run: `npm test`
Expected: FAIL — module `./drawHelpers` bestaat nog niet.

- [ ] **Step 3: Implementeer drawHelpers.ts**

Create `src/games/drawHelpers.ts`:
```ts
// Pure helpers voor het Tekenbord — geen DOM, los te testen.

export const PALETTE: string[] = [
  '#000000', // zwart
  '#ffffff', // wit
  '#e6194b', // rood
  '#f58231', // oranje
  '#ffe119', // geel
  '#3cb44b', // groen
  '#42d4f4', // lichtblauw
  '#4363d8', // blauw
  '#911eb4', // paars
  '#f032e6', // roze
  '#9a6324', // bruin
  '#fabed4', // lichtroze
];

/** Verhoogt de regenboog-hue met `step`, gewikkeld binnen 0-359. */
export function nextRainbowHue(hue: number, step: number): number {
  return (((hue + step) % 360) + 360) % 360;
}

/** Zet een hue (0-359) om naar een hex-kleur (volle verzadiging/helderheid). */
export function hueToHex(hue: number): string {
  const s = 1;
  const v = 1;
  const c = v * s;
  const hp = hue / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp >= 0 && hp < 1) { r = c; g = x; b = 0; }
  else if (hp < 2) { r = x; g = c; b = 0; }
  else if (hp < 3) { r = 0; g = c; b = x; }
  else if (hp < 4) { r = 0; g = x; b = c; }
  else if (hp < 5) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const m = v - c;
  const toHex = (n: number) =>
    Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface DrawStickerDef {
  id: string;
  emoji: string;
  name: string;
}

export const STICKER_DEFS: DrawStickerDef[] = [
  { id: 'first_draw', emoji: '🖌️', name: 'Eerste Tekening' },
  { id: 'rainbow_used', emoji: '🌈', name: 'Regenboog Kunst' },
  { id: 'all_colors', emoji: '🎨', name: 'Kleurenmeester' },
  { id: 'stamp_fan', emoji: '🐾', name: 'Stempel Fan' },
  { id: 'saved_5', emoji: '🖼️', name: 'Kunstenaar' },
  { id: 'first_coloring', emoji: '📄', name: 'Kleurplaat Held' },
];

export interface DrawStats {
  strokes: number;
  rainbowUsed: boolean;
  colorsUsed: string[];
  stampsPlaced: number;
  drawingsSaved: number;
  coloringPagesSaved: number;
}

/** Bepaalt welke sticker-ids verdiend zijn op basis van de statistieken. */
export function evaluateStickers(stats: DrawStats): string[] {
  const earned: string[] = [];
  if (stats.strokes >= 1) earned.push('first_draw');
  if (stats.rainbowUsed) earned.push('rainbow_used');
  if (PALETTE.every(c => stats.colorsUsed.includes(c))) earned.push('all_colors');
  if (stats.stampsPlaced >= 10) earned.push('stamp_fan');
  if (stats.drawingsSaved >= 5) earned.push('saved_5');
  if (stats.coloringPagesSaved >= 1) earned.push('first_coloring');
  return earned;
}
```

- [ ] **Step 4: Run tests, verifieer slagen**

Run: `npm test`
Expected: PASS — alle drawHelpers-tests groen.

- [ ] **Step 5: Commit**

```bash
git add src/games/drawHelpers.ts src/games/drawHelpers.test.ts
git commit -m "feat: tekenbord pure helpers (palette, rainbow, stickers)"
```

---

## Task 3: coloringPages — kleurplaat-data met tests

**Files:**
- Create: `src/games/coloringPages.ts`
- Test: `src/games/coloringPages.test.ts`

Elke kleurplaat is een lijntekening in een 100x100 viewBox als één of meer SVG-pad-strings. Bij gebruik tekenen we ze licht-grijs op het canvas, geschaald naar het canvas-formaat.

- [ ] **Step 1: Schrijf de falende tests**

Create `src/games/coloringPages.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests, verifieer falen**

Run: `npm test`
Expected: FAIL — module `./coloringPages` bestaat nog niet.

- [ ] **Step 3: Implementeer coloringPages.ts**

Create `src/games/coloringPages.ts`:
```ts
export interface ColoringPage {
  id: string;
  name: string;
  emoji: string;
  /** SVG-pad-strings in een 100x100 viewBox (alleen omtrek). */
  paths: string[];
}

export const COLORING_PAGES: ColoringPage[] = [
  {
    id: 'heart', name: 'Hartje', emoji: '❤️',
    paths: ['M50 80 C20 55 20 25 40 25 C48 25 50 33 50 38 C50 33 52 25 60 25 C80 25 80 55 50 80 Z'],
  },
  {
    id: 'star', name: 'Ster', emoji: '⭐',
    paths: ['M50 12 L61 38 L90 40 L67 58 L75 86 L50 70 L25 86 L33 58 L10 40 L39 38 Z'],
  },
  {
    id: 'flower', name: 'Bloem', emoji: '🌸',
    paths: [
      'M50 50 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0',
      'M50 40 C44 22 56 22 50 40',
      'M60 50 C78 44 78 56 60 50',
      'M50 60 C56 78 44 78 50 60',
      'M40 50 C22 56 22 44 40 50',
      'M50 72 L50 92',
    ],
  },
  {
    id: 'fish', name: 'Vis', emoji: '🐟',
    paths: [
      'M20 50 C30 30 60 30 72 50 C60 70 30 70 20 50 Z',
      'M72 50 L90 38 L90 62 Z',
      'M40 44 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
    ],
  },
  {
    id: 'cat', name: 'Kat', emoji: '🐱',
    paths: [
      'M50 55 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0',
      'M32 38 L26 20 L44 32 Z',
      'M68 38 L74 20 L56 32 Z',
      'M42 52 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
      'M58 52 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
      'M50 60 L46 66 L54 66 Z',
    ],
  },
  {
    id: 'house', name: 'Huis', emoji: '🏠',
    paths: [
      'M25 50 L25 85 L75 85 L75 50 Z',
      'M18 52 L50 24 L82 52 Z',
      'M42 85 L42 66 L58 66 L58 85',
      'M30 58 L40 58 L40 68 L30 68 Z',
    ],
  },
  {
    id: 'butterfly', name: 'Vlinder', emoji: '🦋',
    paths: [
      'M50 30 L50 72',
      'M50 40 C25 18 18 50 50 52 C18 54 25 86 50 64',
      'M50 40 C75 18 82 50 50 52 C82 54 75 86 50 64',
      'M50 30 L44 20 M50 30 L56 20',
    ],
  },
  {
    id: 'car', name: 'Auto', emoji: '🚗',
    paths: [
      'M15 60 L25 60 L33 46 L67 46 L75 60 L85 60 L85 72 L15 72 Z',
      'M33 72 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0',
      'M67 72 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0',
      'M38 48 L46 58 L62 58 L62 48 Z',
    ],
  },
];

/** Bouwt SVG-markup (als string) voor een kleurplaat met de gegeven lijnkleur. */
export function buildSvgMarkup(page: ColoringPage, strokeColor: string): string {
  const paths = page.paths
    .map(d => `<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${paths}</svg>`;
}
```

- [ ] **Step 4: Run tests, verifieer slagen**

Run: `npm test`
Expected: PASS — alle coloringPages-tests groen.

- [ ] **Step 5: Commit**

```bash
git add src/games/coloringPages.ts src/games/coloringPages.test.ts
git commit -m "feat: tekenbord kleurplaat-data (svg lijntekeningen)"
```

---

## Task 4: DrawGame — canvas + basis-penseel

Bouwt de component met canvas, pointer-tekenen met één kleur en vaste dikte, plus terug-knop (knop + Escape). Verdere tools komen in latere taken.

**Files:**
- Create: `src/games/DrawGame.tsx`
- Create: `src/games/DrawGame.css`

- [ ] **Step 1: Maak DrawGame.css**

Create `src/games/DrawGame.css`:
```css
.draw-screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg, #fff);
  touch-action: none;
}
.draw-topbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
}
.draw-back-btn {
  font-size: 1.5rem;
  padding: 0.4rem 0.9rem;
  border: none;
  border-radius: 14px;
  background: #ffd166;
  cursor: pointer;
}
.draw-title { font-size: 1.4rem; font-weight: 800; margin: 0; }
.draw-canvas-wrap { flex: 1; position: relative; min-height: 0; }
.draw-canvas {
  width: 100%;
  height: 100%;
  display: block;
  background: #ffffff;
  touch-action: none;
}
.draw-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem;
  background: #f3f3f7;
}
.draw-tool-btn {
  font-size: 1.4rem;
  min-width: 52px;
  min-height: 52px;
  border: 3px solid transparent;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
}
.draw-tool-btn.active { border-color: #4363d8; }
.draw-swatch {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px #ccc;
  cursor: pointer;
  padding: 0;
}
.draw-swatch.active { box-shadow: 0 0 0 3px #4363d8; }
.draw-size-dot { border-radius: 50%; background: #333; }
.draw-sticker-popup {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border: 4px solid #ffd166;
  border-radius: 20px;
  padding: 1rem 1.5rem;
  text-align: center;
  font-size: 1.2rem;
  z-index: 50;
}
.draw-sticker-popup .emoji { font-size: 3rem; display: block; }
.draw-confirm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 60;
}
.draw-confirm-box {
  background: #fff; border-radius: 20px; padding: 1.5rem;
  text-align: center; max-width: 320px;
}
.draw-confirm-box button { margin: 0.5rem; padding: 0.6rem 1.2rem; font-size: 1.1rem; border-radius: 12px; border: none; cursor: pointer; }
.draw-confirm-yes { background: #e6194b; color: #fff; }
.draw-confirm-no { background: #ccc; }
.draw-picker-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
```

- [ ] **Step 2: Maak DrawGame.tsx met canvas + basis-penseel**

Create `src/games/DrawGame.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import { playClick } from '../utils/sounds';
import './DrawGame.css';

interface DrawGameProps {
  onBack: () => void;
}

export function DrawGame({ onBack }: DrawGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const [color] = useState('#000000');
  const [size] = useState(8);

  // Canvas opzetten op container-formaat met devicePixelRatio.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wrap = canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctxRef.current = ctx;
  }, []);

  // Escape = terug.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    last.current = pos(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !ctxRef.current || !last.current) return;
    const ctx = ctxRef.current;
    const p = pos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    drawing.current = false;
    last.current = null;
  };

  return (
    <div className="draw-screen">
      <div className="draw-topbar">
        <button className="draw-back-btn" onClick={() => { playClick(); onBack(); }}>🏠</button>
        <h1 className="draw-title">🎨 Tekenen</h1>
      </div>
      <div className="draw-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="draw-canvas"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
      </div>
      <div className="draw-toolbar">
        <span>Tekenen met muis of vinger</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verifieer build**

Run: `npm run build`
Expected: PASS — tsc + vite build zonder errors (component nog niet gekoppeld; ongebruikte import vermijden — `size`/`color` worden gebruikt, dus geen TS-noused-error).

- [ ] **Step 4: Commit**

```bash
git add src/games/DrawGame.tsx src/games/DrawGame.css
git commit -m "feat: tekenbord canvas met basis-penseel"
```

---

## Task 5: Hub-integratie (kaart + screen) — vroeg koppelen om in browser te testen

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Importeer DrawGame**

In `src/App.tsx`, na de bestaande game-imports (na regel `import { MemoryGame } from './games/MemoryGame';`):
```tsx
import { DrawGame } from './games/DrawGame';
```

- [ ] **Step 2: Breid het Screen-type uit**

Wijzig de `Screen`-type-regel:
```tsx
type Screen = 'welcome' | 'snake' | 'animal' | 'memory' | 'tekenen';
```

- [ ] **Step 3: Render DrawGame**

Na het `if (screen === 'memory') { ... }`-blok, voeg toe:
```tsx
  if (screen === 'tekenen') {
    return <DrawGame onBack={() => { setDrawStickers(loadDrawStickers()); setScreen('welcome'); }} />;
  }
```
(NB: `setDrawStickers` en `loadDrawStickers` worden in Task 9 toegevoegd. Tot dan, gebruik tijdelijk `onBack={() => setScreen('welcome')}` en pas dit in Task 9 aan.)

- [ ] **Step 4: Voeg de game-kaart toe**

In `.game-cards`, na de memory-kaart-knop:
```tsx
        <button className="game-card game-card-draw" onClick={() => setScreen('tekenen')}>
          <span className="game-card-icon">🎨</span>
          <span className="game-card-title">Tekenen</span>
          <span className="game-card-desc">Teken en kleur!</span>
        </button>
```

- [ ] **Step 5: Build + handmatige browsercheck**

Run: `npm run build`
Expected: PASS.

Run: `npm run dev`, open de URL, klik de "Tekenen"-kaart.
Verwacht: canvas verschijnt; tekenen met muis werkt; 🏠 en Escape gaan terug naar de hub.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: tekenbord gekoppeld aan hub (kaart + screen)"
```

---

## Task 6: Kleuren, kleurenkiezer, penseeldiktes en gum

**Files:**
- Modify: `src/games/DrawGame.tsx`

- [ ] **Step 1: Importeer palette + state**

Wijzig in `DrawGame.tsx` de import-regel van sounds naar:
```tsx
import { playClick } from '../utils/sounds';
import { PALETTE } from './drawHelpers';
```

Vervang de twee state-regels (`const [color] = ...` en `const [size] = ...`) door:
```tsx
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(8);
  const SIZES = [4, 8, 16];
```

- [ ] **Step 2: Pas de teken-logica aan voor gum**

Vervang in `move` de twee regels die `strokeStyle`/`lineWidth` zetten door:
```tsx
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? size * 2.5 : size;
```

- [ ] **Step 3: Vervang de toolbar-inhoud**

Vervang het `<div className="draw-toolbar">...</div>`-blok door:
```tsx
      <div className="draw-toolbar">
        <div className="draw-picker-row">
          {PALETTE.map(c => (
            <button
              key={c}
              className={`draw-swatch ${tool === 'brush' && color === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => { setColor(c); setTool('brush'); playClick(); }}
              aria-label={`kleur ${c}`}
            />
          ))}
          <input
            type="color"
            className="draw-swatch"
            value={color}
            onChange={e => { setColor(e.target.value); setTool('brush'); }}
            aria-label="eigen kleur"
          />
        </div>
        <div className="draw-picker-row">
          {SIZES.map(s => (
            <button
              key={s}
              className={`draw-tool-btn ${size === s ? 'active' : ''}`}
              onClick={() => { setSize(s); playClick(); }}
              aria-label={`dikte ${s}`}
            >
              <span className="draw-size-dot" style={{ width: s + 4, height: s + 4, display: 'inline-block' }} />
            </button>
          ))}
          <button
            className={`draw-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => { setTool('eraser'); playClick(); }}
          >🩹</button>
        </div>
      </div>
```

- [ ] **Step 4: Build + browsercheck**

Run: `npm run build`
Expected: PASS.
Browser: kleur kiezen werkt, eigen kleur via kiezer werkt, 3 diktes werken, gum wist (tekent wit).

- [ ] **Step 5: Commit**

```bash
git add src/games/DrawGame.tsx
git commit -m "feat: tekenbord kleuren, kleurenkiezer, diktes en gum"
```

---

## Task 7: Regenboog-kwast

**Files:**
- Modify: `src/games/DrawGame.tsx`

- [ ] **Step 1: Importeer regenboog-helpers**

Wijzig de drawHelpers-import:
```tsx
import { PALETTE, nextRainbowHue, hueToHex } from './drawHelpers';
```

- [ ] **Step 2: Breid tool-type en hue-ref uit**

Wijzig de `tool`-state:
```tsx
  const [tool, setTool] = useState<'brush' | 'eraser' | 'rainbow'>('brush');
```
Voeg onder de andere refs toe:
```tsx
  const hue = useRef(0);
```

- [ ] **Step 3: Pas teken-logica aan voor regenboog**

Vervang de `strokeStyle`/`lineWidth`-toekenning in `move` door:
```tsx
    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = size * 2.5;
    } else if (tool === 'rainbow') {
      hue.current = nextRainbowHue(hue.current, 8);
      ctx.strokeStyle = hueToHex(hue.current);
      ctx.lineWidth = size;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }
```

- [ ] **Step 4: Voeg een regenboog-knop toe**

In de tweede `.draw-picker-row` (bij de gum-knop), na de gum-knop:
```tsx
          <button
            className={`draw-tool-btn ${tool === 'rainbow' ? 'active' : ''}`}
            onClick={() => { setTool('rainbow'); playClick(); }}
          >🌈</button>
```

- [ ] **Step 5: Build + browsercheck**

Run: `npm run build`
Expected: PASS.
Browser: 🌈-knop tekent met steeds veranderende kleur.

- [ ] **Step 6: Commit**

```bash
git add src/games/DrawGame.tsx
git commit -m "feat: tekenbord regenboog-kwast"
```

---

## Task 8: Undo, wissen (met bevestiging) en opslaan als PNG

**Files:**
- Modify: `src/games/DrawGame.tsx`

- [ ] **Step 1: Voeg undo-buffer en confirm-state toe**

Onder de bestaande refs/state:
```tsx
  const undoStack = useRef<string[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
```

- [ ] **Step 2: Snapshot-helpers + undo**

Voeg deze functies toe binnen de component (na `end`):
```tsx
  const snapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (undoStack.current.length >= 10) undoStack.current.shift();
    undoStack.current.push(canvas.toDataURL());
  };

  const undo = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const prev = undoStack.current.pop();
    const rect = canvas.parentElement!.getBoundingClientRect();
    if (!prev) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      return;
    }
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, rect.width, rect.height); ctx.drawImage(img, 0, 0, rect.width, rect.height); };
    img.src = prev;
    playClick();
  };
```

- [ ] **Step 3: Snapshot vóór elke streek**

Voeg in `start`, als eerste regel binnen de functie, toe:
```tsx
    snapshot();
```

- [ ] **Step 4: Wissen + opslaan-functies**

Voeg toe (na `undo`):
```tsx
  const doClear = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    snapshot();
    const rect = canvas.parentElement!.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setConfirmClear(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = 'melina-tekening.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    playClick();
  };
```

- [ ] **Step 5: Voeg knoppen toe aan de toolbar**

Voeg een derde `.draw-picker-row` toe vóór het sluiten van `.draw-toolbar`:
```tsx
        <div className="draw-picker-row">
          <button className="draw-tool-btn" onClick={undo}>↩️</button>
          <button className="draw-tool-btn" onClick={() => { setConfirmClear(true); playClick(); }}>🗑️</button>
          <button className="draw-tool-btn" onClick={save}>💾</button>
        </div>
```

- [ ] **Step 6: Voeg de bevestig-dialoog toe**

Vóór de afsluitende `</div>` van `.draw-screen`:
```tsx
      {confirmClear && (
        <div className="draw-confirm-overlay" onClick={() => setConfirmClear(false)}>
          <div className="draw-confirm-box" onClick={e => e.stopPropagation()}>
            <p>Weet je het zeker? Alles wordt gewist.</p>
            <button className="draw-confirm-yes" onClick={doClear}>Ja, wissen</button>
            <button className="draw-confirm-no" onClick={() => setConfirmClear(false)}>Nee</button>
          </div>
        </div>
      )}
```

- [ ] **Step 7: Build + browsercheck**

Run: `npm run build`
Expected: PASS.
Browser: teken iets → ↩️ maakt laatste streek ongedaan; 🗑️ vraagt bevestiging en wist; 💾 downloadt een PNG.

- [ ] **Step 8: Commit**

```bash
git add src/games/DrawGame.tsx
git commit -m "feat: tekenbord undo, wissen-met-bevestiging en opslaan PNG"
```

---

## Task 9: Stickers/achievements + persistentie + hub-stickermuur

**Files:**
- Modify: `src/games/DrawGame.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Importeer sticker-logica in DrawGame**

Wijzig de drawHelpers-import:
```tsx
import {
  PALETTE, nextRainbowHue, hueToHex,
  STICKER_DEFS, evaluateStickers, type DrawStats,
} from './drawHelpers';
import { playCorrect } from '../utils/sounds';
```
(Behoud de bestaande `playClick`-import; combineer eventueel: `import { playClick, playCorrect } from '../utils/sounds';`.)

- [ ] **Step 2: Stats- en sticker-state**

Voeg toe bij de overige state/refs:
```tsx
  const stats = useRef<DrawStats>({
    strokes: 0, rainbowUsed: false, colorsUsed: [],
    stampsPlaced: 0, drawingsSaved: 0, coloringPagesSaved: 0,
  });
  const [earned, setEarned] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('drawStickers') || '[]'); }
    catch { return []; }
  });
  const [newSticker, setNewSticker] = useState<{ emoji: string; name: string } | null>(null);
```

- [ ] **Step 3: Sticker-check helper**

Voeg toe binnen de component:
```tsx
  const checkStickers = () => {
    const all = evaluateStickers(stats.current);
    const fresh = all.filter(id => !earned.includes(id));
    if (fresh.length === 0) return;
    const updated = [...earned, ...fresh];
    setEarned(updated);
    localStorage.setItem('drawStickers', JSON.stringify(updated));
    const def = STICKER_DEFS.find(s => s.id === fresh[0])!;
    setNewSticker({ emoji: def.emoji, name: def.name });
    playCorrect();
    setTimeout(() => setNewSticker(null), 2500);
  };
```

- [ ] **Step 4: Stats bijwerken op acties**

In `start`, na `snapshot();`:
```tsx
    stats.current.strokes += 1;
    if (tool === 'rainbow') stats.current.rainbowUsed = true;
    if (tool === 'brush' && !stats.current.colorsUsed.includes(color)) {
      stats.current.colorsUsed.push(color);
    }
```
In `end`, als laatste regel:
```tsx
    checkStickers();
```
In `save`, na `a.click();`:
```tsx
    stats.current.drawingsSaved += 1;
    checkStickers();
```

- [ ] **Step 5: Sticker-popup tonen**

Vóór de afsluitende `</div>` van `.draw-screen` (naast de confirm-dialoog):
```tsx
      {newSticker && (
        <div className="draw-sticker-popup">
          <span className="emoji">{newSticker.emoji}</span>
          Nieuwe sticker!<br />{newSticker.name}
        </div>
      )}
```

- [ ] **Step 6: Hub — loader + state + sticker-sectie**

In `src/App.tsx`, na `loadMemoryStickers`:
```tsx
import { STICKER_DEFS as DRAW_STICKER_DEFS } from './games/drawHelpers';

function loadDrawStickers(): string[] {
  try {
    const saved = localStorage.getItem('drawStickers');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}
```
(Plaats de `import` bovenaan bij de andere imports, niet midden in het bestand.)

In de component, bij de andere sticker-states:
```tsx
  const [drawStickers, setDrawStickers] = useState(loadDrawStickers);
```

Werk `totalStickers` en `totalPossible` bij:
```tsx
  const totalStickers = snakeStickers.length + animalStickers.length + memoryStickers.length + drawStickers.length;
```
```tsx
  const totalPossible = STICKER_MILESTONES.length + ANIMAL_STICKER_DEFS.length + MEMORY_STICKER_DEFS.length + DRAW_STICKER_DEFS.length;
```

Werk de `onBack` voor `tekenen` bij (uit Task 5 Step 3):
```tsx
  if (screen === 'tekenen') {
    return <DrawGame onBack={() => { setDrawStickers(loadDrawStickers()); setScreen('welcome'); }} />;
  }
```

In de stickermuur, na de Memory-sticker-sectie (`</div>` na de MEMORY_STICKER_DEFS-map):
```tsx
            <p className="sticker-wall-game">🎨 Tekenen</p>
            <div className="sticker-wall-items">
              {DRAW_STICKER_DEFS.map(s => {
                const key = `draw_${s.id}`;
                const earnedSticker = drawStickers.includes(s.id);
                const hidden = hiddenStickers.includes(key);
                return (
                  <div
                    key={s.id}
                    className={`sticker-wall-card ${earnedSticker ? (hidden ? 'sticker-wall-hidden' : 'sticker-wall-earned') : 'sticker-wall-locked-card'}`}
                    onClick={() => earnedSticker && toggleHidden(key)}
                  >
                    <span className="sticker-wall-emoji">{earnedSticker ? s.emoji : '🔒'}</span>
                    <span className="sticker-wall-name">{earnedSticker ? s.name : '???'}</span>
                    {earnedSticker && hidden && <span className="sticker-hidden-badge">verborgen</span>}
                  </div>
                );
              })}
            </div>
```

- [ ] **Step 7: Build + browsercheck**

Run: `npm run build`
Expected: PASS.
Browser: teken een streek → "Eerste Tekening"-sticker popup; terug naar hub → sticker telt mee en staat in "🎨 Tekenen"-sectie van de stickermuur.

- [ ] **Step 8: Commit**

```bash
git add src/games/DrawGame.tsx src/App.tsx
git commit -m "feat: tekenbord stickers + hub-stickermuur"
```

---

## Task 10: Stempels

**Files:**
- Modify: `src/games/DrawGame.tsx`

- [ ] **Step 1: Stempel-data en state**

Voeg een constante toe boven de component:
```tsx
const STAMPS = ['🐱', '🐶', '🐰', '🦋', '🌸', '⭐', '❤️', '🌈', '🚗', '🐟'];
```
Breid het tool-type uit:
```tsx
  const [tool, setTool] = useState<'brush' | 'eraser' | 'rainbow' | 'stamp'>('brush');
  const [stamp, setStamp] = useState(STAMPS[0]);
```

- [ ] **Step 2: Stempel plaatsen bij pointerdown**

Voeg bovenaan in `start`, vóór `snapshot();` (zodat undo de stempel ongedaan maakt), deze afhandeling toe en stop dan:
```tsx
    if (tool === 'stamp') {
      snapshot();
      const ctx = ctxRef.current;
      if (ctx) {
        const p = pos(e);
        ctx.font = `${size * 6}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stamp, p.x, p.y);
      }
      stats.current.stampsPlaced += 1;
      checkStickers();
      return;
    }
```
(NB: het bestaande `snapshot();` daaronder blijft voor de penseel/regenboog/gum-modus.)

- [ ] **Step 3: Stempel-kiezer in de toolbar**

Voeg een rij toe in `.draw-toolbar` (na de regenboog/gum-rij):
```tsx
        <div className="draw-picker-row">
          {STAMPS.map(s => (
            <button
              key={s}
              className={`draw-tool-btn ${tool === 'stamp' && stamp === s ? 'active' : ''}`}
              onClick={() => { setStamp(s); setTool('stamp'); playClick(); }}
            >{s}</button>
          ))}
        </div>
```

- [ ] **Step 4: Build + browsercheck**

Run: `npm run build`
Expected: PASS.
Browser: kies een stempel, tik op het doek → emoji verschijnt; dikte beïnvloedt grootte; undo verwijdert de stempel; na 10 stempels komt de "Stempel Fan"-sticker.

- [ ] **Step 5: Commit**

```bash
git add src/games/DrawGame.tsx
git commit -m "feat: tekenbord stempels"
```

---

## Task 11: Kleurplaten

**Files:**
- Modify: `src/games/DrawGame.tsx`

- [ ] **Step 1: Importeer kleurplaten**

Voeg toe bij de imports:
```tsx
import { COLORING_PAGES, buildSvgMarkup, type ColoringPage } from './coloringPages';
```

- [ ] **Step 2: State voor kleurplaat-kiezer en actieve kleurplaat**

Voeg toe bij de state:
```tsx
  const [showPages, setShowPages] = useState(false);
  const activePageIsColoring = useRef(false);
```

- [ ] **Step 3: Kleurplaat op canvas tekenen**

Voeg een functie toe binnen de component:
```tsx
  const loadColoringPage = (page: ColoringPage) => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    snapshot();
    const rect = canvas.parentElement!.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    const svg = buildSvgMarkup(page, '#bbbbbb');
    const img = new Image();
    img.onload = () => {
      const s = Math.min(rect.width, rect.height) * 0.9;
      const x = (rect.width - s) / 2;
      const y = (rect.height - s) / 2;
      ctx.drawImage(img, x, y, s, s);
    };
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    activePageIsColoring.current = true;
    setShowPages(false);
    playClick();
  };
```

- [ ] **Step 4: Tel opgeslagen kleurplaten mee**

Wijzig in `save` het stats-blok naar:
```tsx
    stats.current.drawingsSaved += 1;
    if (activePageIsColoring.current) {
      stats.current.coloringPagesSaved += 1;
      activePageIsColoring.current = false;
    }
    checkStickers();
```

- [ ] **Step 5: Knop + kiezer-overlay**

Voeg in de undo/wis/opslaan-rij een kleurplaat-knop toe (vóór ↩️):
```tsx
          <button className="draw-tool-btn" onClick={() => { setShowPages(true); playClick(); }}>📄</button>
```
Voeg vóór de afsluitende `</div>` van `.draw-screen` de overlay toe:
```tsx
      {showPages && (
        <div className="draw-confirm-overlay" onClick={() => setShowPages(false)}>
          <div className="draw-confirm-box" onClick={e => e.stopPropagation()}>
            <p>Kies een kleurplaat</p>
            <div className="draw-picker-row" style={{ justifyContent: 'center' }}>
              {COLORING_PAGES.map(p => (
                <button key={p.id} className="draw-tool-btn" onClick={() => loadColoringPage(p)}>
                  {p.emoji}
                </button>
              ))}
            </div>
            <button className="draw-confirm-no" onClick={() => setShowPages(false)}>Sluiten</button>
          </div>
        </div>
      )}
```

- [ ] **Step 6: Build + browsercheck**

Run: `npm run build`
Expected: PASS.
Browser: 📄 → kies bijv. Hartje → grijze omtrek verschijnt; inkleuren erover werkt; opslaan → "Kleurplaat Held"-sticker.

- [ ] **Step 7: Commit**

```bash
git add src/games/DrawGame.tsx
git commit -m "feat: tekenbord kleurplaten"
```

---

## Task 12: Eindverificatie

**Files:** geen (alleen verificatie)

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: geen errors. (Fix eventuele ongebruikte imports/variabelen.)

- [ ] **Step 2: Tests**

Run: `npm test`
Expected: PASS — alle drawHelpers- en coloringPages-tests groen.

- [ ] **Step 3: Productie-build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Handmatige eindcheck in de browser**

Run: `npm run dev` en doorloop:
- [ ] Tekenen met muis én (indien mogelijk) touch
- [ ] Kleur kiezen uit palet + eigen kleur via kiezer
- [ ] 3 penseeldiktes
- [ ] Regenboog-kwast verandert van kleur
- [ ] Gum wist
- [ ] Undo (meerdere stappen)
- [ ] Wissen vraagt bevestiging
- [ ] Opslaan downloadt een PNG
- [ ] Stempel plaatsen
- [ ] Kleurplaat kiezen + inkleuren + opslaan
- [ ] Stickers verschijnen en staan in de stickermuur onder "🎨 Tekenen"
- [ ] 🏠-knop en Escape gaan terug naar de hub
- [ ] Mute-knop in de hub dempt ook de tekengeluiden

- [ ] **Step 5: Eind-commit (indien fixes nodig waren)**

```bash
git add -A
git commit -m "chore: tekenbord eindverificatie + fixes"
```

---

## Notities voor de uitvoerder

- Volg het bestaande patroon van `SnakeGame`/`MemoryGame` voor stijl en sticker-persistentie.
- `localStorage`-sleutel voor stickers: `drawStickers` (array van id-strings).
- Canvas gebruikt `devicePixelRatio`; reken posities altijd met `getBoundingClientRect()`.
- Geen permanente galerij — opslaan = PNG-download (bewust buiten scope).
