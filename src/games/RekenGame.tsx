import { useEffect, useRef, useState } from 'react';
import { playClick, playCorrect, playWrong } from '../utils/sounds';
import {
  GROEPEN,
  configForGroep,
  generateProblem,
  TEMPO_SECONDS,
  REKEN_STICKER_DEFS,
  evaluateStickers,
  type Problem,
  type RekenStats,
} from './rekenHelpers';
import './RekenGame.css';

interface RekenGameProps {
  onBack: () => void;
}

type Phase = 'menu' | 'rustig' | 'tempo' | 'tempoDone';
type Feedback = 'idle' | 'good' | 'wrong';

function tempoBestFor(groep: number): number {
  try { return Number(localStorage.getItem(`rekenTempoBest_g${groep}`) || '0'); }
  catch { return 0; }
}

export function RekenGame({ onBack }: RekenGameProps) {
  const [phase, setPhase] = useState<Phase>('menu');
  const [groep, setGroep] = useState(4);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [locked, setLocked] = useState(false);

  // Rustig
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);

  // Tempo
  const [timeLeft, setTimeLeft] = useState(TEMPO_SECONDS);
  const [tempoCorrect, setTempoCorrect] = useState(0);
  const [tempoBest, setTempoBest] = useState(0);

  // Stickers
  const [earned, setEarned] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('rekenStickers') || '[]'); }
    catch { return []; }
  });
  const [newSticker, setNewSticker] = useState<{ emoji: string; name: string } | null>(null);
  const stats = useRef<RekenStats>({ correct: 0, bestStreak: 0, tempoBest: 0, maxGroep: 0 });

  // Escape = terug naar de hub.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onBack(); return; }
      if (phase !== 'rustig' && phase !== 'tempo') return;
      if (locked) return;
      if (e.key >= '0' && e.key <= '9') setInput(v => (v.length < 7 ? v + e.key : v));
      else if (e.key === 'Backspace') setInput(v => v.slice(0, -1));
      else if (e.key === 'Enter') submit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, locked, input, problem, streak, correct, tempoCorrect, groep, earned]);

  // Tempo-timer: telt af; bij 0 -> resultaat + beste score opslaan.
  useEffect(() => {
    if (phase !== 'tempo') return;
    if (timeLeft <= 0) {
      const best = Math.max(tempoBestFor(groep), tempoCorrect);
      localStorage.setItem(`rekenTempoBest_g${groep}`, String(best));
      setTempoBest(best);
      stats.current.tempoBest = Math.max(stats.current.tempoBest ?? 0, tempoCorrect);
      checkStickers();
      setPhase('tempoDone');
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

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

  const startRustig = () => {
    setCorrect(0); setStreak(0); setInput(''); setFeedback('idle'); setLocked(false);
    stats.current.maxGroep = Math.max(stats.current.maxGroep ?? 0, groep);
    setProblem(generateProblem(groep));
    setPhase('rustig');
    playClick();
  };

  const startTempo = () => {
    setTempoCorrect(0); setTimeLeft(TEMPO_SECONDS); setInput(''); setFeedback('idle'); setLocked(false);
    stats.current.maxGroep = Math.max(stats.current.maxGroep ?? 0, groep);
    setProblem(generateProblem(groep));
    setPhase('tempo');
    playClick();
  };

  const press = (digit: string) => {
    if (locked) return;
    playClick();
    setInput(v => (v.length < 7 ? v + digit : v));
  };

  const backspace = () => {
    if (locked) return;
    setInput(v => v.slice(0, -1));
  };

  const submitRustig = () => {
    if (locked || !problem || input === '') return;
    const value = Number(input);
    if (value === problem.answer) {
      const newStreak = streak + 1;
      const newCorrect = correct + 1;
      setStreak(newStreak);
      setCorrect(newCorrect);
      setFeedback('good');
      setLocked(true);
      playCorrect();
      stats.current.correct = newCorrect;
      stats.current.bestStreak = Math.max(stats.current.bestStreak, newStreak);
      checkStickers();
      setTimeout(() => {
        setProblem(generateProblem(groep));
        setInput(''); setFeedback('idle'); setLocked(false);
      }, 800);
    } else {
      setFeedback('wrong');
      setLocked(true);
      setStreak(0);
      playWrong();
      setTimeout(() => {
        setProblem(generateProblem(groep));
        setInput(''); setFeedback('idle'); setLocked(false);
      }, 1500);
    }
  };

  const submitTempo = () => {
    if (!problem || input === '') return;
    if (Number(input) === problem.answer) {
      setTempoCorrect(c => c + 1);
      playCorrect();
    } else {
      playWrong();
    }
    setInput('');
    setProblem(generateProblem(groep));
  };

  const submit = () => {
    if (phase === 'tempo') submitTempo();
    else if (phase === 'rustig') submitRustig();
  };

  // ---- Menu ----
  if (phase === 'menu') {
    const cfg = configForGroep(groep);
    return (
      <div className="reken-screen reken-menu">
        <div className="reken-topbar">
          <button className="reken-back-btn" onClick={() => { playClick(); onBack(); }}>🏠</button>
          <h1 className="reken-title">➕ Rekenen</h1>
          <div className="reken-score" />
        </div>

        <div className="reken-menu-body">
          <p className="reken-menu-label">Kies je groep:</p>
          <div className="reken-groep-row">
            {GROEPEN.map(g => (
              <button
                key={g.groep}
                className={`reken-groep-btn ${groep === g.groep ? 'active' : ''}`}
                onClick={() => { setGroep(g.groep); playClick(); }}
              >
                {g.groep}
              </button>
            ))}
          </div>
          <p className="reken-menu-sub">{cfg.label}: {cfg.ops.join('  ')}</p>

          <div className="reken-mode-row">
            <button className="reken-mode-btn reken-mode-rustig" onClick={startRustig}>
              <span className="reken-mode-icon">🧠</span>
              Rustig oefenen
            </button>
            <button className="reken-mode-btn reken-mode-tempo" onClick={startTempo}>
              <span className="reken-mode-icon">⏱️</span>
              Tempo (2 minuten)
              <span className="reken-mode-best">Beste: {tempoBestFor(groep)} goed</span>
            </button>
          </div>
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

  // ---- Tempo resultaat ----
  if (phase === 'tempoDone') {
    return (
      <div className="reken-screen reken-done">
        <div className="reken-topbar">
          <button className="reken-back-btn" onClick={() => { playClick(); onBack(); }}>🏠</button>
          <h1 className="reken-title">⏱️ Tempo</h1>
          <div className="reken-score" />
        </div>
        <div className="reken-stage">
          <div className="reken-done-card">
            <div className="reken-done-big">Tijd voorbij! ⏰</div>
            <div className="reken-done-score">Je had <b>{tempoCorrect}</b> goed!</div>
            <div className="reken-done-best">Beste van {configForGroep(groep).label}: {tempoBest} 🏆</div>
            <div className="reken-done-buttons">
              <button className="reken-key reken-key-ok" onClick={startTempo}>Nog een keer</button>
              <button className="reken-key" onClick={() => { setPhase('menu'); playClick(); }}>Menu</button>
            </div>
          </div>
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

  // ---- Spelen (rustig of tempo) ----
  const isTempo = phase === 'tempo';
  return (
    <div className={`reken-screen reken-${feedback}`}>
      <div className="reken-topbar">
        <button className="reken-back-btn" onClick={() => { playClick(); setPhase('menu'); }}>↩️</button>
        <h1 className="reken-title">{isTempo ? '⏱️ Tempo' : '🧠 Rekenen'}</h1>
        <div className="reken-score">{isTempo ? `⏰ ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}` : `⭐ ${correct}`}</div>
      </div>

      <div className="reken-levelbar">
        <span className="reken-level">{configForGroep(groep).label}</span>
        {isTempo
          ? <span className="reken-streak">✅ {tempoCorrect} goed</span>
          : <span className="reken-streak">🔥 {streak}</span>}
      </div>

      <div className="reken-stage">
        {problem && (
          <div className="reken-problem">
            {problem.a} {problem.op} {problem.b} = <span className="reken-answer-slot">{input || '?'}</span>
          </div>
        )}
        {!isTempo && feedback === 'good' && <div className="reken-feedback good">Goed zo! 🎉</div>}
        {!isTempo && feedback === 'wrong' && problem && (
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
