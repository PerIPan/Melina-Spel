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
