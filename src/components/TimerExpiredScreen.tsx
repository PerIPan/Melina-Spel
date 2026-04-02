import { useEffect, useRef } from "react";
import { speak } from "../utils/speech";
import type { Language } from "../utils/i18n";
import { t } from "../utils/i18n";

interface TimerExpiredScreenProps {
  onPlayAgain: () => void;
  lang: Language;
}

export function TimerExpiredScreen({ onPlayAgain, lang }: TimerExpiredScreenProps) {
  const spoken = useRef(false);

  useEffect(() => {
    if (spoken.current) return;
    spoken.current = true;
    speak(t(lang, "timerExpiredSpeech"));
  }, [lang]);

  return (
    <div className="screen timer-expired-screen">
      <div className="celebration-emoji bounce">⏰</div>
      <h1 className="celebration-title">{t(lang, "timerExpired")}</h1>
      <p className="celebration-text">{t(lang, "timerExpiredText")}</p>
      <button className="btn btn-start" onClick={onPlayAgain}>
        {t(lang, "playAgain")}
      </button>
    </div>
  );
}
