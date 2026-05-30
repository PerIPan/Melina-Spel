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
