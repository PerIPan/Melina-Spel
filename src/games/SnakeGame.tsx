import { useState, useEffect, useCallback, useRef } from 'react';
import './SnakeGame.css';

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const CELL_SIZE = 28;
const INITIAL_SPEED = 200;
const SPEED_INCREMENT = 3;
const MIN_SPEED = 90;

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

function loadStickers(): number[] {
  try {
    const saved = localStorage.getItem('snakeStickers');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveStickers(scores: number[]): void {
  localStorage.setItem('snakeStickers', JSON.stringify(scores));
}

interface SnakeGameProps {
  onBack: () => void;
}

export function SnakeGame({ onBack }: SnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved) : 0;
  });
  const [earnedStickers, setEarnedStickers] = useState<number[]>(loadStickers);
  const [newSticker, setNewSticker] = useState<Sticker | null>(null);
  const [showCollection, setShowCollection] = useState(false);

  const directionRef = useRef<Direction>(direction);
  const snakeRef = useRef<Position[]>(snake);
  const foodRef = useRef<Position>(food);
  const speedRef = useRef(INITIAL_SPEED);
  const scoreRef = useRef(0);

  directionRef.current = direction;
  snakeRef.current = snake;
  foodRef.current = food;

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const checkSticker = useCallback((newScore: number) => {
    const milestone = STICKER_MILESTONES.find(
      s => s.score === newScore && !earnedStickers.includes(s.score)
    );
    if (milestone) {
      const updated = [...earnedStickers, milestone.score];
      setEarnedStickers(updated);
      saveStickers(updated);
      setNewSticker(milestone);
      setGameRunning(false);
    }
  }, [earnedStickers]);

  const acceptSticker = useCallback(() => {
    setNewSticker(null);
    setGameRunning(true);
  }, []);

  const rejectSticker = useCallback(() => {
    if (newSticker) {
      const updated = earnedStickers.filter(s => s !== newSticker.score);
      setEarnedStickers(updated);
      saveStickers(updated);
    }
    setNewSticker(null);
    setGameRunning(true);
  }, [newSticker, earnedStickers]);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    setScore(0);
    scoreRef.current = 0;
    setGameOver(false);
    setGameRunning(false);
    speedRef.current = INITIAL_SPEED;
  }, [generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (newSticker) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          acceptSticker();
        }
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (gameOver) {
          resetGame();
          setTimeout(() => setGameRunning(true), 50);
        } else {
          setGameRunning(prev => !prev);
        }
        return;
      }

      if (e.key === 'Escape') {
        if (showCollection) {
          setShowCollection(false);
        } else {
          onBack();
        }
        return;
      }

      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
        W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
      };

      const newDir = keyMap[e.key];
      if (!newDir) return;

      e.preventDefault();
      const opposites: Record<Direction, Direction> = {
        UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
      };

      if (opposites[newDir] !== directionRef.current) {
        setDirection(newDir);
      }

      if (!gameRunning && !gameOver) {
        setGameRunning(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameRunning, gameOver, resetGame, onBack, newSticker, acceptSticker, showCollection]);

  useEffect(() => {
    if (!gameRunning || gameOver) return;

    const gameLoop = setInterval(() => {
      const currentSnake = snakeRef.current;
      const currentFood = foodRef.current;
      const currentDir = directionRef.current;

      const head = { ...currentSnake[0] };

      switch (currentDir) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Wrap around: door muren heen naar de andere kant
      if (head.x < 0) head.x = GRID_SIZE - 1;
      if (head.x >= GRID_SIZE) head.x = 0;
      if (head.y < 0) head.y = GRID_SIZE - 1;
      if (head.y >= GRID_SIZE) head.y = 0;

      if (currentSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
        setGameOver(true);
        setGameRunning(false);
        return;
      }

      const newSnake = [head, ...currentSnake];

      if (head.x === currentFood.x && head.y === currentFood.y) {
        const newScore = currentSnake.length;
        scoreRef.current = newScore;
        setScore(newScore);
        setHighScore(prev => {
          const best = Math.max(prev, newScore);
          localStorage.setItem('snakeHighScore', best.toString());
          return best;
        });
        setFood(generateFood(newSnake));
        speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREMENT);
        checkSticker(newScore);
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    }, speedRef.current);

    return () => clearInterval(gameLoop);
  }, [gameRunning, gameOver, generateFood, checkSticker]);

  const collectedCount = earnedStickers.length;
  const totalCount = STICKER_MILESTONES.length;

  return (
    <div className="snake-container">
      <div className="snake-top-row">
        <button className="snake-back-btn" onClick={onBack}>
          🎮 Melina Spel
        </button>
        <button
          className="snake-sticker-btn"
          onClick={() => setShowCollection(s => !s)}
          title="Stickers"
        >
          🏆 {collectedCount}/{totalCount}
        </button>
      </div>

      <h1 className="snake-title">Snake</h1>

      <div className="snake-scoreboard">
        <div className="snake-score-item">
          <span className="snake-label">Score</span>
          <span className="snake-value">{score}</span>
        </div>
        <div className="snake-score-item">
          <span className="snake-label">Best</span>
          <span className="snake-value">{highScore}</span>
        </div>
      </div>

      <div
        className="snake-grid"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
        }}
      >
        {snake.map((segment, i) => (
          <div
            key={i}
            className={`snake-cell ${i === 0 ? 'snake-head' : 'snake-body'}`}
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />
        ))}

        <div
          className="snake-cell snake-food"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
          }}
        />

        {!gameRunning && !gameOver && score === 0 && !newSticker && (
          <div className="snake-overlay">
            <p>Druk op <strong>Spatie</strong> of een pijltjestoets</p>
            <button className="snake-btn" onClick={() => setGameRunning(true)}>Start</button>
          </div>
        )}

        {!gameRunning && !gameOver && score > 0 && !newSticker && (
          <div className="snake-overlay">
            <p>Gepauzeerd</p>
            <button className="snake-btn" onClick={() => setGameRunning(true)}>Verder</button>
          </div>
        )}

        {gameOver && (
          <div className="snake-overlay snake-game-over">
            <h2>Game Over!</h2>
            <p className="snake-final-score">Score: {score}</p>
            {score === highScore && score > 0 && <p className="snake-new-record">Nieuw record!</p>}
            {/* Toon verdiende stickers van dit potje */}
            {STICKER_MILESTONES.filter(s => s.score <= score && earnedStickers.includes(s.score)).length > 0 && (
              <div className="snake-earned-row">
                {STICKER_MILESTONES.filter(s => s.score <= score && earnedStickers.includes(s.score)).map(s => (
                  <span key={s.score} className="snake-earned-mini" title={s.name}>{s.emoji}</span>
                ))}
              </div>
            )}
            <button className="snake-btn" onClick={() => { resetGame(); setTimeout(() => setGameRunning(true), 50); }}>
              Opnieuw
            </button>
          </div>
        )}

        {/* Sticker popup */}
        {newSticker && (
          <div className="snake-overlay snake-sticker-popup">
            <div className="sticker-earned-emoji">{newSticker.emoji}</div>
            <h2 className="sticker-earned-title">Nieuwe Sticker!</h2>
            <p className="sticker-earned-name">{newSticker.name}</p>
            <p className="sticker-earned-desc">Score {newSticker.score} bereikt!</p>
            <div className="sticker-choice-buttons">
              <button className="snake-btn" onClick={acceptSticker}>Houden!</button>
              <button className="snake-btn snake-btn-reject" onClick={rejectSticker}>Nee bedankt</button>
            </div>
          </div>
        )}
      </div>

      <div className="snake-controls-info">
        <span>Pijltjestoetsen / WASD</span>
        <span>Spatie = pauze</span>
      </div>

      <div className="snake-mobile-controls">
        <div className="snake-control-row">
          <button onClick={() => { setDirection('UP'); if (!gameRunning && !gameOver) setGameRunning(true); }}>&#9650;</button>
        </div>
        <div className="snake-control-row">
          <button onClick={() => { setDirection('LEFT'); if (!gameRunning && !gameOver) setGameRunning(true); }}>&#9664;</button>
          <button onClick={() => { setDirection('DOWN'); if (!gameRunning && !gameOver) setGameRunning(true); }}>&#9660;</button>
          <button onClick={() => { setDirection('RIGHT'); if (!gameRunning && !gameOver) setGameRunning(true); }}>&#9654;</button>
        </div>
      </div>

      {/* Stickerverzameling */}
      {showCollection && (
        <div className="sticker-collection-overlay" onClick={() => setShowCollection(false)}>
          <div className="sticker-collection" onClick={e => e.stopPropagation()}>
            <div className="sticker-collection-header">
              <h2>Mijn Stickers</h2>
              <button className="sticker-close" onClick={() => setShowCollection(false)}>✕</button>
            </div>
            <p className="sticker-progress">{collectedCount} van {totalCount} verzameld</p>
            <div className="sticker-grid">
              {STICKER_MILESTONES.map(s => {
                const earned = earnedStickers.includes(s.score);
                return (
                  <div key={s.score} className={`sticker-item ${earned ? 'sticker-earned' : 'sticker-locked'}`}>
                    <span className="sticker-emoji">{earned ? s.emoji : '🔒'}</span>
                    <span className="sticker-item-name">{earned ? s.name : '???'}</span>
                    <span className="sticker-item-score">Score {s.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
