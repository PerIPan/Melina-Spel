import { useState, useEffect, useRef } from "react";
import { speak } from "../utils/speech";
import type { Language } from "../utils/i18n";
import { t } from "../utils/i18n";

interface QuizGuessScreenProps {
  onSubmitGuess: (guess: string) => void;
  onBack: () => void;
  lang: Language;
}

export function QuizGuessScreen({ onSubmitGuess, onBack, lang }: QuizGuessScreenProps) {
  const [guess, setGuess] = useState("");
  const spoken = useRef(false);

  useEffect(() => {
    if (spoken.current) return;
    spoken.current = true;
    speak(t(lang, "quizTypeGuessSpeech"));
  }, [lang]);

  const handleSubmit = () => {
    if (guess.trim()) {
      onSubmitGuess(guess.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && guess.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className="screen quiz-guess-screen">
      <div className="thinking-emoji">🎯</div>
      <div className="question-card">
        <h2>{t(lang, "quizTypeGuess")}</h2>
      </div>
      <input
        className="learn-input"
        type="text"
        placeholder={t(lang, "quizGuessPlaceholder")}
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <button
        className="btn btn-start"
        disabled={!guess.trim()}
        onClick={handleSubmit}
      >
        {t(lang, "quizSubmitGuess")}
      </button>
      <button className="btn btn-reset" onClick={onBack}>
        {t(lang, "quizGoBack")}
      </button>
    </div>
  );
}
