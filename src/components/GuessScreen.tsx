import { useEffect, useRef } from "react";
import { speak } from "../utils/speech";
import type { Language } from "../utils/i18n";
import { t, tAnimal } from "../utils/i18n";

interface GuessScreenProps {
  animal: string;
  emoji: string;
  onYes: () => void;
  onNo: () => void;
  onRestart: () => void;
  lang: Language;
}

export function GuessScreen({ animal, emoji, onYes, onNo, onRestart, lang }: GuessScreenProps) {
  const spoken = useRef(false);

  useEffect(() => {
    if (spoken.current) return;
    spoken.current = true;
    speak(t(lang, "isItA", { animal: tAnimal(lang, animal) }));
  }, [animal, lang]);

  return (
    <div className="screen guess-screen">
      <div className="guess-emoji">{emoji}</div>
      <div className="question-card">
        <h2>{t(lang, "isItA", { animal: tAnimal(lang, animal) })}</h2>
      </div>
      <div className="button-row">
        <button className="btn btn-yes" onClick={onYes}>
          {t(lang, "yesGuess")}
        </button>
        <button className="btn btn-no" onClick={onNo}>
          {t(lang, "noGuess")}
        </button>
      </div>
      <button className="btn btn-reset" onClick={onRestart}>
        {t(lang, "startOver")}
      </button>
    </div>
  );
}
