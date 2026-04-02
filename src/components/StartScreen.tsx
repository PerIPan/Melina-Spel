import { useState, useEffect, useRef, useMemo } from "react";
import { speak } from "../utils/speech";
import type { Language } from "../utils/i18n";
import { t } from "../utils/i18n";

interface StartScreenProps {
  onStartClassic: () => void;
  onStartTimer: (seconds: number) => void;
  onStartQuiz: () => void;
  animalCount: number;
  lang: Language;
}

const allEmojis = [
  "🐶", "🐱", "🐸", "🦋", "🐘", "🐬", "🐧", "🦁", "🐴", "🐰",
  "🐍", "🦊", "🐻", "🦅", "🐢", "🐙", "🦈", "🐳", "🦜", "🐝",
  "🦒", "🐆", "🐺", "🦉", "🦩", "🐊", "🦘", "🐼", "🦭", "🐞",
  "🦦", "🦇", "🐒", "🦚", "🪼", "🐿️", "🦔", "🐠", "🦎", "🦬",
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const TIMER_OPTIONS = [30, 60, 90];

export function StartScreen({ onStartClassic, onStartTimer, onStartQuiz, animalCount, lang }: StartScreenProps) {
  const spoken = useRef(false);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const floatingEmojis = useMemo(() => shuffleArray(allEmojis).slice(0, 10), []);

  useEffect(() => {
    if (spoken.current) return;
    spoken.current = true;
    speak(t(lang, "welcomeSpeech", { count: animalCount }));
  }, [animalCount, lang]);

  return (
    <div className="screen start-screen">
      <div className="floating-emojis">
        {floatingEmojis.map((emoji, i) => (
          <span key={i} className="floating-emoji" style={{ animationDelay: `${i * 0.3}s` }}>
            {emoji}
          </span>
        ))}
      </div>
      <h1 className="game-title">{t(lang, "title")}</h1>
      <p className="subtitle">{t(lang, "subtitle")}</p>
      <p className="animal-count" dangerouslySetInnerHTML={{
        __html: t(lang, "animalCount", { count: animalCount }).replace(
          String(animalCount),
          `<strong>${animalCount}</strong>`
        ),
      }} />

      <div className="mode-cards">
        <button className="mode-card mode-classic" onClick={onStartClassic}>
          <span className="mode-icon">🧠</span>
          <span className="mode-title">{t(lang, "classicMode")}</span>
          <span className="mode-desc">{t(lang, "classicModeDesc")}</span>
        </button>

        <button
          className="mode-card mode-timer"
          onClick={() => setShowTimerPicker((s) => !s)}
        >
          <span className="mode-icon">⏱️</span>
          <span className="mode-title">{t(lang, "timerMode")}</span>
          <span className="mode-desc">{t(lang, "timerModeDesc")}</span>
        </button>

        <button className="mode-card mode-quiz" onClick={onStartQuiz}>
          <span className="mode-icon">🎯</span>
          <span className="mode-title">{t(lang, "quizMode")}</span>
          <span className="mode-desc">{t(lang, "quizModeDesc")}</span>
        </button>
      </div>

      {showTimerPicker && (
        <div className="timer-picker">
          <p className="timer-picker-label">{t(lang, "selectTime")}</p>
          <div className="timer-options">
            {TIMER_OPTIONS.map((sec) => (
              <button
                key={sec}
                className="btn btn-timer-option"
                onClick={() => onStartTimer(sec)}
              >
                {sec}{t(lang, "seconds")}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
