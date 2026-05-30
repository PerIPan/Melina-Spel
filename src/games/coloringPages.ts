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
  {
    id: 'crown', name: 'Prinsessenkroon', emoji: '👑',
    paths: [
      'M20 70 L25 35 L40 55 L50 30 L60 55 L75 35 L80 70 Z',
      'M20 70 L80 70 L80 80 L20 80 Z',
      'M25 35 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
      'M50 30 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
      'M75 35 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
    ],
  },
  {
    id: 'icecream', name: 'IJsje', emoji: '🍦',
    paths: [
      'M40 46 L60 46 L50 90 Z',
      'M50 46 m-13 0 a13 13 0 1 0 26 0 a13 13 0 1 0 -26 0',
      'M50 28 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0',
      'M43 56 L48 64 M52 56 L57 64',
    ],
  },
  {
    id: 'balloon', name: 'Ballon', emoji: '🎈',
    paths: [
      'M50 18 C28 18 26 50 50 62 C74 50 72 18 50 18 Z',
      'M50 62 L46 68 L54 68 Z',
      'M50 68 C45 76 55 84 50 94',
    ],
  },
  {
    id: 'rainbow', name: 'Regenboog', emoji: '🌈',
    paths: [
      'M12 78 A38 38 0 0 1 88 78',
      'M24 78 A26 26 0 0 1 76 78',
      'M36 78 A14 14 0 0 1 64 78',
    ],
  },
  {
    id: 'rocket', name: 'Raket', emoji: '🚀',
    paths: [
      'M50 10 C63 24 63 54 50 66 C37 54 37 24 50 10 Z',
      'M50 36 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0',
      'M40 52 L28 72 L42 64 Z',
      'M60 52 L72 72 L58 64 Z',
      'M44 66 L50 84 L56 66',
    ],
  },
  {
    id: 'dog', name: 'Hond', emoji: '🐶',
    paths: [
      'M50 56 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0',
      'M28 42 C18 40 16 60 30 62',
      'M72 42 C82 40 84 60 70 62',
      'M42 54 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
      'M58 54 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
      'M50 62 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
      'M50 66 L50 72',
    ],
  },
  {
    id: 'microphone', name: 'Microfoon', emoji: '🎤',
    paths: [
      'M50 16 m-13 0 a13 17 0 1 0 26 0 a13 17 0 1 0 -26 0',
      'M50 50 L50 74',
      'M36 74 L64 74 L64 80 L36 80 Z',
      'M42 20 L58 20 M41 28 L59 28 M42 36 L58 36',
    ],
  },
  {
    id: 'guitar', name: 'Gitaar', emoji: '🎸',
    paths: [
      'M40 64 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0',
      'M45 48 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0',
      'M53 44 L80 14',
      'M76 10 L86 20 L82 24 L72 14 Z',
      'M40 64 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
    ],
  },
  {
    id: 'lipstick', name: 'Lippenstift', emoji: '💄',
    paths: [
      'M42 50 L58 50 L58 84 L42 84 Z',
      'M42 50 L46 28 L58 36 L58 50 Z',
      'M42 60 L58 60',
    ],
  },
  {
    id: 'unicorn', name: 'Eenhoorn', emoji: '🦄',
    paths: [
      'M34 74 C28 52 40 38 56 38 C68 38 74 47 74 58 L74 76',
      'M56 38 L60 20 L66 36 Z',
      'M47 34 C49 26 55 26 55 34',
      'M45 52 m-2.5 0 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0',
      'M30 46 C22 48 22 58 30 62',
      'M34 38 C26 40 26 50 33 52',
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
