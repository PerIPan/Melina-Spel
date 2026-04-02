import { useEffect, useRef, useMemo } from "react";
import { speak } from "../utils/speech";
import type { Language } from "../utils/i18n";
import { t, tQuestion } from "../utils/i18n";

interface QuestionScreenProps {
  question: string;
  onYes: () => void;
  onNo: () => void;
  onNotSure: () => void;
  onRestart: () => void;
  lang: Language;
}

const thinkingEmojis = ["🤔", "🧐", "💭", "🔍", "🎯", "🤨", "🧠", "👀", "🕵️", "💡"];

export function QuestionScreen({ question, onYes, onNo, onNotSure, onRestart, lang }: QuestionScreenProps) {
  const lastSpoken = useRef("");
  const emoji = useMemo(
    () => thinkingEmojis[Math.floor(Math.random() * thinkingEmojis.length)],
    [question]
  );

  useEffect(() => {
    const translated = tQuestion(lang, question);
    if (lastSpoken.current === translated) return;
    lastSpoken.current = translated;
    speak(translated);
  }, [question, lang]);

  return (
    <div className="screen question-screen">
      <div className="thinking-emoji">{emoji}</div>
      <div className="question-card">
        <h2>{tQuestion(lang, question)}</h2>
      </div>
      <div className="button-row">
        <button className="btn btn-yes" onClick={onYes}>
          {t(lang, "yes")}
        </button>
        <button className="btn btn-no" onClick={onNo}>
          {t(lang, "no")}
        </button>
      </div>
      <button className="btn btn-not-sure" onClick={onNotSure}>
        {t(lang, "notSure")}
      </button>
      <button className="btn btn-reset" onClick={onRestart}>
        {t(lang, "startOver")}
      </button>
    </div>
  );
}
