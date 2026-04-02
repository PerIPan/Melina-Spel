import { useState, useEffect, useCallback, useRef } from 'react';
import './MemoryGame.css';

interface MemoryGameProps {
  onBack: () => void;
}

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

const ALL_EMOJIS = [
  '🐶', '🐱', '🐸', '🦋', '🐘', '🐬', '🐧', '🦁', '🐴', '🐰',
  '🐍', '🦊', '🐻', '🦅', '🐢', '🐙', '🦈', '🐳', '🦜', '🐝',
  '🦒', '🐆', '🐺', '🦉', '🦩', '🐊', '🦘', '🐼', '🐞', '🦦',
];

type Difficulty = 'makkelijk' | 'normaal' | 'moeilijk';
type GameMode = '2spelers' | 'computer' | 'levels';

const GRID_CONFIG: Record<Difficulty, { pairs: number; cols: number }> = {
  makkelijk: { pairs: 6, cols: 4 },
  normaal: { pairs: 8, cols: 4 },
  moeilijk: { pairs: 12, cols: 6 },
};

// Computer memory chance per difficulty (how likely it remembers a seen card)
const COMPUTER_MEMORY: Record<Difficulty, number> = {
  makkelijk: 0.35,
  normaal: 0.55,
  moeilijk: 0.75,
};

// Level system: each level has more pairs and needs fewer moves for stars
interface LevelDef {
  pairs: number;
  cols: number;
  starMoves: [number, number, number]; // 3 stars, 2 stars, 1 star (max moves)
}

const LEVELS: LevelDef[] = [
  { pairs: 3,  cols: 3, starMoves: [3, 5, 8] },
  { pairs: 4,  cols: 4, starMoves: [4, 7, 10] },
  { pairs: 5,  cols: 5, starMoves: [5, 8, 12] },
  { pairs: 6,  cols: 4, starMoves: [6, 10, 15] },
  { pairs: 7,  cols: 7, starMoves: [7, 12, 18] },
  { pairs: 8,  cols: 4, starMoves: [8, 13, 20] },
  { pairs: 9,  cols: 6, starMoves: [9, 15, 22] },
  { pairs: 10, cols: 5, starMoves: [10, 16, 25] },
  { pairs: 12, cols: 6, starMoves: [12, 20, 30] },
  { pairs: 15, cols: 6, starMoves: [15, 25, 38] },
];

function loadLevelProgress(): { level: number; stars: number[] } {
  try {
    const saved = localStorage.getItem('memoryLevels');
    return saved ? JSON.parse(saved) : { level: 1, stars: [] };
  } catch { return { level: 1, stars: [] }; }
}

function saveLevelProgress(progress: { level: number; stars: number[] }): void {
  localStorage.setItem('memoryLevels', JSON.stringify(progress));
}

// Sticker system
interface MemorySticker {
  id: string;
  emoji: string;
  name: string;
}

const MEMORY_STICKERS: MemorySticker[] = [
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

interface MemoryStats {
  wins: number;
  perfectEasy: boolean;
  perfectNormal: boolean;
  perfectHard: boolean;
  fastWin: boolean;
  beatComputer: boolean;
}

function loadMemoryStats(): MemoryStats {
  try {
    const saved = localStorage.getItem('memoryStats');
    return saved ? JSON.parse(saved) : {
      wins: 0, perfectEasy: false, perfectNormal: false, perfectHard: false, fastWin: false, beatComputer: false,
    };
  } catch {
    return { wins: 0, perfectEasy: false, perfectNormal: false, perfectHard: false, fastWin: false, beatComputer: false };
  }
}

function saveMemoryStats(stats: MemoryStats): void {
  localStorage.setItem('memoryStats', JSON.stringify(stats));
}

function loadMemoryStickers(): string[] {
  try {
    const saved = localStorage.getItem('memoryStickers');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveMemoryStickers(ids: string[]): void {
  localStorage.setItem('memoryStickers', JSON.stringify(ids));
}

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createCards(pairs: number): Card[] {
  const chosen = shuffle(ALL_EMOJIS).slice(0, pairs);
  const doubled = [...chosen, ...chosen];
  return shuffle(doubled).map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
}

export function MemoryGame({ onBack }: MemoryGameProps) {
  const [phase, setPhase] = useState<'menu' | 'difficulty' | 'levelselect' | 'playing' | 'finished' | 'levelcomplete'>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('2spelers');
  const [difficulty, setDifficulty] = useState<Difficulty>('makkelijk');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [showSticker, setShowSticker] = useState<MemorySticker | null>(null);
  const [earnedStickers, setEarnedStickers] = useState<string[]>(loadMemoryStickers);
  const [stats, setStats] = useState<MemoryStats>(loadMemoryStats);
  const startTime = useRef(0);

  // Level state
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(loadLevelProgress);
  const [levelStars, setLevelStars] = useState(0);
  const [levelCols, setLevelCols] = useState(4);

  // Computer's memory: maps card id -> emoji (cards it has "seen")
  const computerMemory = useRef<Map<number, string>>(new Map());

  const pickMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'levels') {
      setPhase('levelselect');
    } else {
      setPhase('difficulty');
    }
  }, []);

  const startLevel = useCallback((lvl: number) => {
    const def = LEVELS[lvl - 1];
    setCurrentLevel(lvl);
    setLevelCols(def.cols);
    setCards(createCards(def.pairs));
    setFlippedIds([]);
    setCurrentPlayer(1);
    setScore1(0);
    setScore2(0);
    setMoves(0);
    setLocked(false);
    setPhase('playing');
    startTime.current = Date.now();
  }, []);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setCards(createCards(GRID_CONFIG[diff].pairs));
    setFlippedIds([]);
    setCurrentPlayer(1);
    setScore1(0);
    setScore2(0);
    setMoves(0);
    setLocked(false);
    setPhase('playing');
    startTime.current = Date.now();
    computerMemory.current = new Map();
  }, []);

  const awardSticker = useCallback((id: string) => {
    if (earnedStickers.includes(id)) return;
    const sticker = MEMORY_STICKERS.find(s => s.id === id);
    if (sticker) {
      const updated = [...earnedStickers, id];
      setEarnedStickers(updated);
      saveMemoryStickers(updated);
      setShowSticker(sticker);
    }
  }, [earnedStickers]);

  const checkGameEnd = useCallback((updatedCards: Card[], s1: number, s2: number) => {
    if (!updatedCards.every(c => c.matched)) return;

    const newStats = { ...stats, wins: stats.wins + 1 };
    const elapsed = (Date.now() - startTime.current) / 1000;
    const totalMoves = moves + 1;

    if (gameMode === 'levels') {
      // Calculate stars for this level
      const def = LEVELS[currentLevel - 1];
      const [s3, s2max, s1max] = def.starMoves;
      let stars = 0;
      if (totalMoves <= s3) stars = 3;
      else if (totalMoves <= s2max) stars = 2;
      else if (totalMoves <= s1max) stars = 1;
      else stars = 1; // always at least 1 star for completing

      setLevelStars(stars);

      // Update progress
      const newProgress = { ...levelProgress };
      if (!newProgress.stars) newProgress.stars = [];
      // Save best stars for this level
      const prevStars = newProgress.stars[currentLevel - 1] || 0;
      newProgress.stars[currentLevel - 1] = Math.max(prevStars, stars);
      // Unlock next level
      if (currentLevel >= newProgress.level && currentLevel < LEVELS.length) {
        newProgress.level = currentLevel + 1;
      }
      setLevelProgress(newProgress);
      saveLevelProgress(newProgress);

      setPhase('levelcomplete');
    } else {
      const { pairs } = GRID_CONFIG[difficulty];
      const isPerfect = totalMoves === pairs;

      if (isPerfect && difficulty === 'makkelijk') newStats.perfectEasy = true;
      if (isPerfect && difficulty === 'normaal') newStats.perfectNormal = true;
      if (isPerfect && difficulty === 'moeilijk') newStats.perfectHard = true;
      if (elapsed < 30 && difficulty === 'makkelijk') newStats.fastWin = true;
      if (gameMode === 'computer' && s1 > s2) newStats.beatComputer = true;

      setPhase('finished');
    }

    setStats(newStats);
    saveMemoryStats(newStats);

    if (newStats.wins >= 1) awardSticker('first_win');
    if (newStats.wins >= 5) awardSticker('win_5');
    if (newStats.wins >= 10) awardSticker('win_10');
    if (newStats.wins >= 20) awardSticker('win_20');
    if (newStats.perfectEasy) awardSticker('perfect_easy');
    if (newStats.perfectNormal) awardSticker('perfect_normal');
    if (newStats.perfectHard) awardSticker('perfect_hard');
    if (newStats.fastWin) awardSticker('fast_win');
    if (newStats.beatComputer) awardSticker('beat_computer');
  }, [stats, difficulty, moves, awardSticker, gameMode, currentLevel, levelProgress]);

  // Process a pair of flipped cards
  const processPair = useCallback((newCards: Card[], first: number, second: number, player: 1 | 2) => {
    const card1 = newCards.find(c => c.id === first)!;
    const card2 = newCards.find(c => c.id === second)!;

    // Computer remembers these cards
    const mem = computerMemory.current;
    mem.set(first, card1.emoji);
    mem.set(second, card2.emoji);

    if (card1.emoji === card2.emoji) {
      setTimeout(() => {
        const matched = newCards.map(c =>
          c.id === first || c.id === second ? { ...c, matched: true } : c
        );
        setCards(matched);
        setFlippedIds([]);

        const newS1 = player === 1 ? score1 + 1 : score1;
        const newS2 = player === 2 ? score2 + 1 : score2;
        if (player === 1) setScore1(s => s + 1);
        else setScore2(s => s + 1);

        // Remove matched cards from computer memory
        mem.delete(first);
        mem.delete(second);

        if (matched.every(c => c.matched)) {
          setLocked(false);
          checkGameEnd(matched, newS1, newS2);
        } else {
          // Same player gets another turn
          if (gameMode === 'computer' && player === 2) {
            // Computer gets another turn
            setTimeout(() => computerTurn(matched), 800);
          } else {
            setLocked(false);
          }
        }
      }, 500);
    } else {
      setTimeout(() => {
        const reset = newCards.map(c =>
          c.id === first || c.id === second ? { ...c, flipped: false } : c
        );
        setCards(reset);
        setFlippedIds([]);
        const nextPlayer = player === 1 ? 2 : 1;
        setCurrentPlayer(nextPlayer as 1 | 2);

        if (gameMode === 'computer' && nextPlayer === 2) {
          setTimeout(() => computerTurn(reset), 700);
        } else {
          setLocked(false);
        }
      }, 900);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score1, score2, gameMode, checkGameEnd]);

  // Computer AI turn
  const computerTurn = useCallback((currentCards: Card[]) => {
    setLocked(true);
    const mem = computerMemory.current;
    const memoryChance = COMPUTER_MEMORY[difficulty];
    const available = currentCards.filter(c => !c.matched && !c.flipped);

    if (available.length < 2) {
      setLocked(false);
      return;
    }

    // Step 1: Check if computer "remembers" a matching pair
    let pick1: number | null = null;
    let pick2: number | null = null;

    if (Math.random() < memoryChance) {
      // Try to find a known pair from memory
      const remembered = [...mem.entries()].filter(([id]) => {
        const c = currentCards.find(c2 => c2.id === id);
        return c && !c.matched;
      });

      for (let i = 0; i < remembered.length; i++) {
        for (let j = i + 1; j < remembered.length; j++) {
          if (remembered[i][1] === remembered[j][1]) {
            pick1 = remembered[i][0];
            pick2 = remembered[j][0];
            break;
          }
        }
        if (pick1 !== null) break;
      }
    }

    // Step 2: If no known pair, pick randomly
    if (pick1 === null || pick2 === null) {
      const shuffled = shuffle(available);
      pick1 = shuffled[0].id;

      // Sometimes use memory for second pick
      if (Math.random() < memoryChance) {
        const firstEmoji = currentCards.find(c => c.id === pick1)!.emoji;
        const knownMatch = [...mem.entries()].find(([id, emoji]) => {
          const c = currentCards.find(c2 => c2.id === id);
          return emoji === firstEmoji && id !== pick1 && c && !c.matched;
        });
        if (knownMatch) {
          pick2 = knownMatch[0];
        }
      }

      if (pick2 === null || pick2 === pick1) {
        const others = shuffled.filter(c => c.id !== pick1);
        pick2 = others[0].id;
      }
    }

    // Flip first card
    const afterFirst = currentCards.map(c =>
      c.id === pick1 ? { ...c, flipped: true } : c
    );
    setCards(afterFirst);
    setFlippedIds([pick1!]);
    setMoves(m => m + 1);

    // Flip second card after delay
    setTimeout(() => {
      const afterSecond = afterFirst.map(c =>
        c.id === pick2 ? { ...c, flipped: true } : c
      );
      setCards(afterSecond);
      setFlippedIds([pick1!, pick2!]);

      // Process the pair
      setTimeout(() => {
        processPair(afterSecond, pick1!, pick2!, 2);
      }, 600);
    }, 700);
  }, [difficulty, processPair]);

  const handleCardClick = useCallback((id: number) => {
    if (locked) return;
    if (gameMode === 'computer' && currentPlayer === 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map(c =>
      c.id === id ? { ...c, flipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      processPair(newCards, newFlipped[0], newFlipped[1], 1);
    }
  }, [cards, flippedIds, locked, currentPlayer, gameMode, processPair]);

  // Keyboard: Escape to go back
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onBack]);

  const activeCols = gameMode === 'levels' ? levelCols : GRID_CONFIG[difficulty].cols;
  const p1Label = gameMode === '2spelers' ? 'Speler 1' : 'Jij';
  const p2Label = gameMode === 'computer' ? 'Computer' : 'Speler 2';
  const winner = score1 > score2 ? p1Label : score2 > score1 ? p2Label : 'Gelijkspel';

  return (
    <div className="memory-container">
      <button className="memory-back-btn" onClick={onBack}>
        🎮 Melina Spel
      </button>

      <h1 className="memory-title">Memory</h1>

      {/* Step 1: Choose mode */}
      {phase === 'menu' && (
        <div className="memory-menu">
          <p className="memory-menu-text">Hoe wil je spelen?</p>
          <div className="memory-diff-cards">
            <button className="memory-diff-card memory-mode-levels" onClick={() => pickMode('levels')}>
              <span className="memory-diff-icon">🗺️</span>
              <span className="memory-diff-name">Levels</span>
              <span className="memory-diff-desc">Level {levelProgress.level} van {LEVELS.length}</span>
            </button>
            <button className="memory-diff-card memory-mode-2p" onClick={() => pickMode('2spelers')}>
              <span className="memory-diff-icon">👫</span>
              <span className="memory-diff-name">2 Spelers</span>
              <span className="memory-diff-desc">Samen spelen</span>
            </button>
            <button className="memory-diff-card memory-mode-cpu" onClick={() => pickMode('computer')}>
              <span className="memory-diff-icon">🤖</span>
              <span className="memory-diff-name">Tegen Computer</span>
              <span className="memory-diff-desc">Kan jij winnen?</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Choose difficulty */}
      {phase === 'difficulty' && (
        <div className="memory-menu">
          <p className="memory-menu-text">Kies moeilijkheid:</p>
          <div className="memory-diff-cards">
            <button className="memory-diff-card memory-diff-easy" onClick={() => startGame('makkelijk')}>
              <span className="memory-diff-icon">😊</span>
              <span className="memory-diff-name">Makkelijk</span>
              <span className="memory-diff-desc">6 paar</span>
            </button>
            <button className="memory-diff-card memory-diff-normal" onClick={() => startGame('normaal')}>
              <span className="memory-diff-icon">🤔</span>
              <span className="memory-diff-name">Normaal</span>
              <span className="memory-diff-desc">8 paar</span>
            </button>
            <button className="memory-diff-card memory-diff-hard" onClick={() => startGame('moeilijk')}>
              <span className="memory-diff-icon">🧠</span>
              <span className="memory-diff-name">Moeilijk</span>
              <span className="memory-diff-desc">12 paar</span>
            </button>
          </div>
        </div>
      )}

      {/* Level select */}
      {phase === 'levelselect' && (
        <div className="memory-menu">
          <p className="memory-menu-text">Kies een level:</p>
          <div className="memory-level-grid">
            {LEVELS.map((def, i) => {
              const lvl = i + 1;
              const unlocked = lvl <= levelProgress.level;
              const stars = levelProgress.stars?.[i] || 0;
              return (
                <button
                  key={lvl}
                  className={`memory-level-btn ${unlocked ? 'memory-level-unlocked' : 'memory-level-locked'}`}
                  onClick={() => unlocked && startLevel(lvl)}
                  disabled={!unlocked}
                >
                  <span className="memory-level-num">{unlocked ? lvl : '🔒'}</span>
                  <span className="memory-level-pairs">{def.pairs} paar</span>
                  {unlocked && (
                    <span className="memory-level-stars">
                      {[1, 2, 3].map(s => (
                        <span key={s} className={s <= stars ? 'star-earned' : 'star-empty'}>★</span>
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <>
          {gameMode === 'levels' ? (
            <div className="memory-scoreboard">
              <div className="memory-level-info">
                <span className="memory-level-label">Level {currentLevel}</span>
                <span className="memory-level-pairs-info">{LEVELS[currentLevel - 1].pairs} paar</span>
              </div>
              <div className="memory-moves">
                <span className="memory-moves-label">Beurten</span>
                <span className="memory-moves-value">{moves}</span>
              </div>
              <div className="memory-moves">
                <span className="memory-moves-label">Gevonden</span>
                <span className="memory-moves-value">{score1}/{LEVELS[currentLevel - 1].pairs}</span>
              </div>
            </div>
          ) : (
            <div className="memory-scoreboard">
              <div className={`memory-player ${currentPlayer === 1 ? 'memory-player-active' : ''}`}>
                <span className="memory-player-label">{p1Label}</span>
                <span className="memory-player-score">{score1}</span>
              </div>
              <div className="memory-moves">
                <span className="memory-moves-label">Beurten</span>
                <span className="memory-moves-value">{moves}</span>
              </div>
              <div className={`memory-player ${currentPlayer === 2 ? 'memory-player-active' : ''}`}>
                <span className="memory-player-label">{p2Label}</span>
                <span className="memory-player-score">{score2}</span>
              </div>
            </div>
          )}

          {gameMode === 'computer' && currentPlayer === 2 && (
            <p className="memory-thinking">🤖 Computer denkt na...</p>
          )}

          <div
            className="memory-grid"
            style={{ gridTemplateColumns: `repeat(${activeCols}, 1fr)` }}
          >
            {cards.map(card => (
              <button
                key={card.id}
                className={`memory-card ${card.flipped || card.matched ? 'memory-card-flipped' : ''} ${card.matched ? 'memory-card-matched' : ''}`}
                onClick={() => handleCardClick(card.id)}
                disabled={card.flipped || card.matched || locked}
              >
                <div className="memory-card-inner">
                  <div className="memory-card-front">❓</div>
                  <div className="memory-card-back">{card.emoji}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'finished' && (
        <div className="memory-finished">
          <div className="memory-trophy">
            {gameMode === 'computer' && score1 > score2 ? '🏆' : '🎉'}
          </div>
          <h2 className="memory-winner">
            {winner === 'Gelijkspel' ? 'Gelijkspel!' : `${winner} wint!`}
          </h2>
          <div className="memory-final-scores">
            <div className="memory-final-player">
              <span>{p1Label}</span>
              <span className="memory-final-score">{score1}</span>
            </div>
            <span className="memory-vs">-</span>
            <div className="memory-final-player">
              <span>{p2Label}</span>
              <span className="memory-final-score">{score2}</span>
            </div>
          </div>
          <p className="memory-final-moves">In {moves} beurten</p>
          <div className="memory-finish-buttons">
            <button className="memory-btn" onClick={() => startGame(difficulty)}>
              Opnieuw
            </button>
            <button className="memory-btn memory-btn-menu" onClick={() => setPhase('menu')}>
              Terug
            </button>
          </div>
        </div>
      )}

      {/* Level complete */}
      {phase === 'levelcomplete' && (
        <div className="memory-finished">
          <div className="memory-trophy">🎉</div>
          <h2 className="memory-winner">Level {currentLevel} gehaald!</h2>
          <div className="memory-stars-display">
            {[1, 2, 3].map(s => (
              <span key={s} className={`memory-star-big ${s <= levelStars ? 'star-earned' : 'star-empty'}`}>★</span>
            ))}
          </div>
          <p className="memory-final-moves">In {moves} beurten</p>
          <div className="memory-finish-buttons">
            {currentLevel < LEVELS.length && (
              <button className="memory-btn" onClick={() => startLevel(currentLevel + 1)}>
                Level {currentLevel + 1} →
              </button>
            )}
            <button className="memory-btn" onClick={() => startLevel(currentLevel)}>
              Opnieuw
            </button>
            <button className="memory-btn memory-btn-menu" onClick={() => setPhase('levelselect')}>
              Levels
            </button>
          </div>
        </div>
      )}

      {/* Sticker popup */}
      {showSticker && (
        <div className="memory-sticker-overlay">
          <div className="memory-sticker-popup" onClick={e => e.stopPropagation()}>
            <div className="memory-sticker-emoji">{showSticker.emoji}</div>
            <h2 className="memory-sticker-title">Nieuwe Sticker!</h2>
            <p className="memory-sticker-name">{showSticker.name}</p>
            <div className="memory-sticker-buttons">
              <button className="memory-btn" onClick={() => setShowSticker(null)}>Houden!</button>
              <button className="memory-btn memory-btn-menu" onClick={() => {
                const updated = earnedStickers.filter(id => id !== showSticker.id);
                setEarnedStickers(updated);
                saveMemoryStickers(updated);
                setShowSticker(null);
              }}>Nee bedankt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
