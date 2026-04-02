import { useEffect, useRef, useState } from "react";
import { speak } from "../utils/speech";
import type { Language } from "../utils/i18n";
import { t, tAnimal } from "../utils/i18n";

interface QuizResultScreenProps {
  correct: boolean;
  secretAnimal: string;
  secretEmoji: string;
  questionsAsked: number;
  onPlayAgain: () => void;
  lang: Language;
}

function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 2,
      color: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff", "#ff9f43"][i % 6],
      size: 6 + Math.random() * 8,
    }))
  );

  return (
    <div className="confetti-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}

export function QuizResultScreen({
  correct,
  secretAnimal,
  secretEmoji,
  questionsAsked,
  onPlayAgain,
  lang,
}: QuizResultScreenProps) {
  const [show, setShow] = useState(false);
  const spoken = useRef(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
    if (spoken.current) return;
    spoken.current = true;
    if (correct) {
      speak(t(lang, "quizCorrectSpeech", { animal: tAnimal(lang, secretAnimal) }));
    } else {
      speak(t(lang, "quizWrongSpeech", { animal: tAnimal(lang, secretAnimal) }));
    }
  }, [correct, secretAnimal, lang]);

  return (
    <div className={`screen celebration-screen ${show ? "show" : ""}`}>
      {correct && <Confetti />}
      <div className="celebration-emoji bounce">
        {correct ? secretEmoji : "😮"}
      </div>
      <h1 className="celebration-title">
        {correct ? t(lang, "quizCorrect") : t(lang, "quizWrong")}
      </h1>
      <p className="celebration-text">
        {correct
          ? t(lang, "quizCorrectText", { animal: tAnimal(lang, secretAnimal), count: questionsAsked })
          : t(lang, "quizWrongText", { animal: tAnimal(lang, secretAnimal), emoji: secretEmoji })}
      </p>
      <button className="btn btn-start" onClick={onPlayAgain}>
        {t(lang, "playAgain")}
      </button>
    </div>
  );
}
