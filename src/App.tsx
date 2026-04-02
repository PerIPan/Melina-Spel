import { useState, useEffect, useMemo } from 'react';
import { SnakeGame } from './games/SnakeGame';
import { AnimalGame } from './games/AnimalGame';
import { MemoryGame } from './games/MemoryGame';
import { isMuted, setMuted } from './utils/sounds';
import { loadTree } from './utils/storage';
import type { TreeNode } from './types';
import './App.css';

function countAnimals(node: TreeNode): number {
  if (node.type === "answer") return 1;
  return countAnimals(node.yes) + countAnimals(node.no);
}

type Screen = 'welcome' | 'snake' | 'animal' | 'memory';

interface Sticker {
  emoji: string;
  name: string;
  score: number;
}

const STICKER_MILESTONES: Sticker[] = [
  { emoji: '⭐', name: 'Eerste Ster', score: 3 },
  { emoji: '🍎', name: 'Appel Held', score: 5 },
  { emoji: '🔥', name: 'Op Stoom', score: 8 },
  { emoji: '🐍', name: 'Slangen Koning', score: 12 },
  { emoji: '💎', name: 'Diamant', score: 16 },
  { emoji: '🏆', name: 'Trofee', score: 20 },
  { emoji: '🚀', name: 'Raket', score: 25 },
  { emoji: '👑', name: 'Kroon', score: 30 },
  { emoji: '🌈', name: 'Regenboog', score: 40 },
  { emoji: '🦄', name: 'Eenhoorn', score: 50 },
];

function loadSnakeStickers(): number[] {
  try {
    const saved = localStorage.getItem('snakeStickers');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

interface AnimalStickerDef {
  id: string;
  emoji: string;
  name: string;
}

const ANIMAL_STICKER_DEFS: AnimalStickerDef[] = [
  { id: "first_guess", emoji: "🎯", name: "Eerste Keer Raak" },
  { id: "guess_5", emoji: "🧠", name: "Slimme Kop" },
  { id: "guess_10", emoji: "🔮", name: "Gedachtelezer" },
  { id: "guess_25", emoji: "🧙", name: "Dieren Tovenaar" },
  { id: "first_teach", emoji: "📚", name: "Leraar" },
  { id: "teach_3", emoji: "🎓", name: "Professor" },
  { id: "teach_10", emoji: "🏫", name: "Schoolhoofd" },
  { id: "first_quiz", emoji: "🎲", name: "Quiz Starter" },
  { id: "quiz_5", emoji: "🕵️", name: "Detective" },
  { id: "timer_win", emoji: "⏱️", name: "Snelheidsduivel" },
];

function loadAnimalStickers(): string[] {
  try {
    const saved = localStorage.getItem('animalStickers');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

interface MemoryStickerDef {
  id: string;
  emoji: string;
  name: string;
}

const MEMORY_STICKER_DEFS: MemoryStickerDef[] = [
  { id: 'first_win', emoji: '🃏', name: 'Eerste Potje' },
  { id: 'win_5', emoji: '🎴', name: 'Kaarten Fan' },
  { id: 'win_10', emoji: '🏅', name: 'Memory Meester' },
  { id: 'perfect_easy', emoji: '✨', name: 'Perfect Makkelijk' },
  { id: 'perfect_normal', emoji: '💫', name: 'Perfect Normaal' },
  { id: 'perfect_hard', emoji: '🌟', name: 'Perfect Moeilijk' },
  { id: 'fast_win', emoji: '⚡', name: 'Bliksem Snel' },
  { id: 'win_20', emoji: '🎪', name: 'Kampioen' },
  { id: 'beat_computer', emoji: '🤖', name: 'Computer Verslagen' },
];

function loadMemoryStickers(): string[] {
  try {
    const saved = localStorage.getItem('memoryStickers');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [muted, setMutedState] = useState(isMuted);
  const animalCount = useMemo(() => countAnimals(loadTree()), []);
  const [snakeStickers, setSnakeStickers] = useState(loadSnakeStickers);
  const [animalStickers, setAnimalStickers] = useState(loadAnimalStickers);
  const [memoryStickers, setMemoryStickers] = useState(loadMemoryStickers);
  const [showStickers, setShowStickers] = useState(false);
  const [hiddenStickers, setHiddenStickers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hiddenStickers');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const totalStickers = snakeStickers.length + animalStickers.length + memoryStickers.length;
  const visibleStickers = totalStickers - hiddenStickers.length;
  const totalPossible = STICKER_MILESTONES.length + ANIMAL_STICKER_DEFS.length + MEMORY_STICKER_DEFS.length;

  const toggleHidden = (key: string) => {
    setHiddenStickers(prev => {
      const updated = prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key];
      localStorage.setItem('hiddenStickers', JSON.stringify(updated));
      return updated;
    });
  };
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('melina-dark') === 'true';
  });

  const toggleMute = () => {
    const newVal = !muted;
    setMuted(newVal);
    setMutedState(newVal);
    if (newVal) window.speechSynthesis.cancel();
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('melina-dark', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('melina-colors');
    if (saved) {
      const [c1, c2] = JSON.parse(saved) as string[];
      document.documentElement.style.setProperty('--bg-gradient-1', c1);
      document.documentElement.style.setProperty('--bg-gradient-2', c2);
    }
  }, []);

  const candies = useMemo(() => {
    const emojis = ['🍬', '🍭', '🍫', '🍩', '🧁', '🍪', '🍰', '🎂', '🍡', '🍮', '🍦', '🍧', '🍨', '🍬', '🍭', '🍫', '🍩', '🧁', '🍪', '🍰'];
    return emojis.map((emoji) => ({
      emoji,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1.2 + Math.random() * 1.5,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 6,
      rotate: Math.random() * 360,
    }));
  }, []);

  if (screen === 'snake') {
    return <SnakeGame onBack={() => { setSnakeStickers(loadSnakeStickers()); setScreen('welcome'); }} />;
  }

  if (screen === 'animal') {
    return <AnimalGame onBack={() => { setAnimalStickers(loadAnimalStickers()); setScreen('welcome'); }} />;
  }

  if (screen === 'memory') {
    return <MemoryGame onBack={() => { setMemoryStickers(loadMemoryStickers()); setScreen('welcome'); }} />;
  }

  return (
    <div className="welcome-screen">
      <div className="candy-background">
        {candies.map((c, i) => (
          <span
            key={i}
            className="candy-piece"
            style={{
              left: `${c.left}%`,
              top: `${c.top}%`,
              fontSize: `${c.size}rem`,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          >
            {c.emoji}
          </span>
        ))}
      </div>

      <div className="welcome-floating-emojis">
        {['🎮', '🐍', '🐾', '🎯', '🏆'].map((emoji, i) => (
          <span
            key={i}
            className="welcome-floating-emoji"
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <h1 className="welcome-title">Melina Spel</h1>
      <p className="welcome-subtitle">Kies een spelletje!</p>

      <div className="game-cards">
        <button className="game-card game-card-snake" onClick={() => setScreen('snake')}>
          <span className="game-card-icon">🐍</span>
          <span className="game-card-title">Snake</span>
          <span className="game-card-desc">Eet appels en groei!</span>
        </button>

        <button className="game-card game-card-animal" onClick={() => setScreen('animal')}>
          <span className="game-card-icon">🐾</span>
          <span className="game-card-title">Raad het Dier</span>
          <span className="game-card-desc">Ik ken {animalCount} dieren! 🧠</span>
        </button>

        <button className="game-card game-card-memory" onClick={() => setScreen('memory')}>
          <span className="game-card-icon">🃏</span>
          <span className="game-card-title">Memory</span>
          <span className="game-card-desc">Vind de paren!</span>
        </button>
      </div>

      {totalStickers > 0 && (
        <button className="sticker-wall-btn" onClick={() => setShowStickers(true)}>
          🏆 Mijn Stickers ({visibleStickers})
        </button>
      )}

      {showStickers && (
        <div className="sticker-overlay" onClick={() => setShowStickers(false)}>
          <div className="sticker-wall-modal" onClick={e => e.stopPropagation()}>
            <div className="sticker-wall-header">
              <h2>Mijn Stickers</h2>
              <button className="sticker-wall-close" onClick={() => setShowStickers(false)}>✕</button>
            </div>
            <p className="sticker-wall-count">{totalStickers} van {totalPossible} verzameld</p>
            <p className="sticker-wall-hint">Klik op een sticker om te tonen of verbergen</p>

            <p className="sticker-wall-game">🐍 Snake</p>
            <div className="sticker-wall-items">
              {STICKER_MILESTONES.map(s => {
                const key = `snake_${s.score}`;
                const earned = snakeStickers.includes(s.score);
                const hidden = hiddenStickers.includes(key);
                return (
                  <div
                    key={s.score}
                    className={`sticker-wall-card ${earned ? (hidden ? 'sticker-wall-hidden' : 'sticker-wall-earned') : 'sticker-wall-locked-card'}`}
                    onClick={() => earned && toggleHidden(key)}
                  >
                    <span className="sticker-wall-emoji">{earned ? s.emoji : '🔒'}</span>
                    <span className="sticker-wall-name">{earned ? s.name : '???'}</span>
                    {earned && hidden && <span className="sticker-hidden-badge">verborgen</span>}
                  </div>
                );
              })}
            </div>

            <p className="sticker-wall-game">🐾 Raad het Dier</p>
            <div className="sticker-wall-items">
              {ANIMAL_STICKER_DEFS.map(s => {
                const key = `animal_${s.id}`;
                const earned = animalStickers.includes(s.id);
                const hidden = hiddenStickers.includes(key);
                return (
                  <div
                    key={s.id}
                    className={`sticker-wall-card ${earned ? (hidden ? 'sticker-wall-hidden' : 'sticker-wall-earned') : 'sticker-wall-locked-card'}`}
                    onClick={() => earned && toggleHidden(key)}
                  >
                    <span className="sticker-wall-emoji">{earned ? s.emoji : '🔒'}</span>
                    <span className="sticker-wall-name">{earned ? s.name : '???'}</span>
                    {earned && hidden && <span className="sticker-hidden-badge">verborgen</span>}
                  </div>
                );
              })}
            </div>

            <p className="sticker-wall-game">🃏 Memory</p>
            <div className="sticker-wall-items">
              {MEMORY_STICKER_DEFS.map(s => {
                const key = `memory_${s.id}`;
                const earned = memoryStickers.includes(s.id);
                const hidden = hiddenStickers.includes(key);
                return (
                  <div
                    key={s.id}
                    className={`sticker-wall-card ${earned ? (hidden ? 'sticker-wall-hidden' : 'sticker-wall-earned') : 'sticker-wall-locked-card'}`}
                    onClick={() => earned && toggleHidden(key)}
                  >
                    <span className="sticker-wall-emoji">{earned ? s.emoji : '🔒'}</span>
                    <span className="sticker-wall-name">{earned ? s.name : '???'}</span>
                    {earned && hidden && <span className="sticker-hidden-badge">verborgen</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="welcome-top-buttons">
        <button className="welcome-top-btn" onClick={toggleMute}>
          {muted ? '🔇' : '🔊'}
        </button>
        <button className="welcome-top-btn" onClick={() => setDarkMode(d => !d)}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  );
}
