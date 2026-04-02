import { useState, useEffect, useRef } from "react";
import { speak } from "../utils/speech";
import type { Language } from "../utils/i18n";
import { t, tAnimal } from "../utils/i18n";

interface LearnScreenProps {
  wrongAnimal: string;
  wrongEmoji: string;
  onLearn: (newAnimal: string, newQuestion: string, answerIsYes: boolean) => void;
  lang: Language;
}

type LearnStep = "ask_animal" | "ask_question" | "ask_answer";

export function LearnScreen({ wrongAnimal, wrongEmoji, onLearn, lang }: LearnScreenProps) {
  const [step, setStep] = useState<LearnStep>("ask_animal");
  const [newAnimal, setNewAnimal] = useState("");
  const [newQuestion, setNewQuestion] = useState("");

  const lastSpokenStep = useRef("");

  useEffect(() => {
    if (lastSpokenStep.current === step) return;
    lastSpokenStep.current = step;

    if (step === "ask_animal") {
      speak(t(lang, "ohNoSpeech"));
    } else if (step === "ask_question") {
      speak(t(lang, "helpLearnSpeech", { new: newAnimal, old: tAnimal(lang, wrongAnimal) }));
    } else if (step === "ask_answer") {
      speak(t(lang, "forAnimalSpeech", { animal: newAnimal, question: newQuestion }));
    }
  }, [step, newAnimal, newQuestion, wrongAnimal, lang]);

  return (
    <div className="screen learn-screen">
      {step === "ask_animal" && (
        <>
          <div className="thinking-emoji">😮</div>
          <div className="question-card">
            <h2>{t(lang, "ohNo")}</h2>
            <p>{t(lang, "whatAnimal")}</p>
          </div>
          <input
            className="learn-input"
            type="text"
            placeholder={t(lang, "typeName")}
            value={newAnimal}
            onChange={(e) => setNewAnimal(e.target.value)}
            autoFocus
          />
          <button
            className="btn btn-start"
            disabled={!newAnimal.trim()}
            onClick={() => setStep("ask_question")}
          >
            {t(lang, "next")}
          </button>
        </>
      )}

      {step === "ask_question" && (
        <>
          <div className="thinking-emoji">📝</div>
          <div className="question-card">
            <h2>{t(lang, "helpLearn")}</h2>
            <p>{t(lang, "whatQuestion", { new: newAnimal, old: tAnimal(lang, wrongAnimal), emoji: wrongEmoji })}</p>
          </div>
          <input
            className="learn-input"
            type="text"
            placeholder={t(lang, "questionPlaceholder")}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            autoFocus
          />
          <button
            className="btn btn-start"
            disabled={!newQuestion.trim()}
            onClick={() => setStep("ask_answer")}
          >
            {t(lang, "next")}
          </button>
        </>
      )}

      {step === "ask_answer" && (
        <>
          <div className="thinking-emoji">🧠</div>
          <div className="question-card">
            <h2>{t(lang, "forAnimal", { animal: newAnimal })}</h2>
            <p>"{newQuestion}"</p>
          </div>
          <p className="subtitle">{t(lang, "yesOrNo")}</p>
          <div className="button-row">
            <button className="btn btn-yes" onClick={() => onLearn(newAnimal.trim(), newQuestion.trim(), true)}>
              {t(lang, "yes")}
            </button>
            <button className="btn btn-no" onClick={() => onLearn(newAnimal.trim(), newQuestion.trim(), false)}>
              {t(lang, "no")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
