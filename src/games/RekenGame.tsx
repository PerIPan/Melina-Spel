import { useEffect, useRef, useState } from 'react';
import { playClick, playCorrect, playWrong } from '../utils/sounds';
import {
  LEVELS,
  generateProblem,
  nextLevelAfterCorrect,
  REKEN_STICKER_DEFS,
  evaluateStickers,
  type Problem,
  type RekenStats,
} from './rekenHelpers';
import './RekenGame.css';

interface RekenGameProps {
  onBack: () => void;
}

type Feedback = 'idle' | 'good' | 'wrong';

export function RekenGame({ onBack }: RekenGameProps) {
  const [level, setLevel] = useState(0);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [input, setInput] = useState('');
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [locked, setLocked] = useState(false);
  const [earned, setEarned] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('rekenStickers') || '[]'); }
    catch { return []; }
  });
  const [newSticker, setNewSticker] = useState<{ emoji: string; name: string } | null>(null);

  const stats = useRef<RekenStats>({ correct: 0, bestStreak: 0, maxLevel: 0 });

  // Eerste som maken (niet tijdens render → Math.random buiten render houden).
  useEffect(() => {
    setProblem(generateProblem(0));
  }, []);

  // Toetsenbord: cijfers, Enter = controleren, Backspace = wissen, Escape = terug.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onBack(); return; }
      if (locked) return;
      if (e.key >= '0' && e.key <= '9') setInput(v => (v.length < 4 ? v + e.key : v));
      else if (e.key === 'Backspace') setInput(v => v.slice(0, -1));
      else if (e.key === 'Enter') submit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, input, problem, streak, correct, level, earned]);

  const checkStickers = () => {
    const all = evaluateStickers(stats.current);
    const fresh = all.filter(id => !earned.includes(id));
    if (fresh.length === 0) return;
    const updated = [...earned, ...fresh];
    setEarned(updated);
    localStorage.setItem('rekenStickers', JSON.stringify(updated));
    const def = REKEN_STICKER_DEFS.find(s => s.id === fresh[0])!;
    setNewSticker({ emoji: def.emoji, name: def.name });
    setTimeout(() => setNewSticker(null), 2500);
  };

  const press = (digit: string) => {
    if (locked) return;
    playClick();
    setInput(v => (v.length < 4 ? v + digit : v));
  };

  const backspace = () => {
    if (locked) return;
    setInput(v => v.slice(0, -1));
  };

  const submit = () => {
    if (locked || !problem || input === '') return;
    const value = Number(input);

    if (value === problem.answer) {
      const newStreak = streak + 1;
      const newCorrect = correct + 1;
      const newLevel = nextLevelAfterCorrect(level, newStreak);
      setStreak(newStreak);
      setCorrect(newCorrect);
      setLevel(newLevel);
      setFeedback('good');
      setLocked(true);
      playCorrect();

      stats.current.correct = newCorrect;
      stats.current.bestStreak = Math.max(stats.current.bestStreak, newStreak);
      stats.current.maxLevel = Math.max(stats.current.maxLevel, newLevel);
      checkStickers();

      setTimeout(() => {
        setProblem(generateProblem(newLevel));
        setInput('');
        setFeedback('idle');
        setLocked(false);
      }, 900);
    } else {
      setFeedback('wrong');
      setLocked(true);
      setStreak(0);
      playWrong();
      setTimeout(() => {
        setProblem(generateProblem(level));
        setInput('');
        setFeedback('idle');
        setLocked(false);
      }, 1600);
    }
  };

  const cfg = LEVELS[level];
  const toNextLevel = level < LEVELS.length - 1 ? 5 - (streak % 5) : 0;

  return (
    <div className={`reken-screen reken-${feedback}`}>
      <div className="reken-topbar">
        <button className="reken-back-btn" onClick={() => { playClick(); onBack(); }}>🏠</button>
        <h1 className="reken-title">➕ Rekenen</h1>
        <div className="reken-score">⭐ {correct}</div>
      </div>

      <div className="reken-levelbar">
        <span className="reken-level">Niveau: {cfg.name}</span>
        <span className="reken-streak">🔥 {streak}</span>
        {level < LEVELS.length - 1
          ? <span className="reken-next">Nog {toNextLevel} goed tot het volgende niveau!</span>
          : <span className="reken-next">Hoogste niveau! 🚀</span>}
      </div>

      <div className="reken-stage">
        {problem && (
          <div className="reken-problem">
            {problem.a} {problem.op} {problem.b} = <span className="reken-answer-slot">{input || '?'}</span>
          </div>
        )}
        {feedback === 'good' && <div className="reken-feedback good">Goed zo! 🎉</div>}
        {feedback === 'wrong' && problem && (
          <div className="reken-feedback wrong">Bijna! Het juiste antwoord is {problem.answer}.</div>
        )}
      </div>

      <div className="reken-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button key={d} className="reken-key" onClick={() => press(d)} disabled={locked}>{d}</button>
        ))}
        <button className="reken-key reken-key-wide" onClick={backspace} disabled={locked} aria-label="wissen">⌫</button>
        <button className="reken-key" onClick={() => press('0')} disabled={locked}>0</button>
        <button className="reken-key reken-key-ok" onClick={submit} disabled={locked || input === ''}>OK</button>
      </div>

      {newSticker && (
        <div className="reken-sticker-popup">
          <span className="emoji">{newSticker.emoji}</span>
          Nieuwe sticker!<br />{newSticker.name}
        </div>
      )}
    </div>
  );
}
