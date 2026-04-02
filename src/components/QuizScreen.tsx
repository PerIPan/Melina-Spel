import { useState, useEffect, useRef } from "react";
import { speak } from "../utils/speech";
import type { Language } from "../utils/i18n";
import type { AnimalRecord } from "../types";
import { t, tQuestion } from "../utils/i18n";
import { answerQuestion, collectAllQuestions } from "../utils/quiz";
import type { TreeNode } from "../types";

interface QuizScreenProps {
  secretAnimal: AnimalRecord;
  tree: TreeNode;
  maxQuestions: number;
  onGuess: (askedCount: number) => void;
  onRestart: () => void;
  lang: Language;
}

interface AskedQuestion {
  question: string;
  displayQuestion: string;
  answer: "yes" | "no" | "not-sure";
}

export function QuizScreen({ secretAnimal, tree, maxQuestions, onGuess, onRestart, lang }: QuizScreenProps) {
  const [inputValue, setInputValue] = useState("");
  const [asked, setAsked] = useState<AskedQuestion[]>([]);
  const allQuestions = useRef(collectAllQuestions(tree));
  const spoken = useRef(false);

  useEffect(() => {
    if (spoken.current) return;
    spoken.current = true;
    speak(t(lang, "quizThinkingSpeech"));
  }, [lang]);

  const questionsLeft = maxQuestions - asked.length;

  const handleAsk = () => {
    const q = inputValue.trim();
    if (!q) return;

    const result = answerQuestion(q, secretAnimal, allQuestions.current);

    const displayQ = result.matchedQuestion
      ? tQuestion(lang, result.matchedQuestion)
      : q;

    const newAsked: AskedQuestion = {
      question: result.matchedQuestion ?? q,
      displayQuestion: displayQ,
      answer: result.answer,
    };

    setAsked((prev) => [...prev, newAsked]);
    setInputValue("");

    // Speak the answer
    if (result.answer === "yes") {
      speak(t(lang, "quizAnswerYes"));
    } else if (result.answer === "no") {
      speak(t(lang, "quizAnswerNo"));
    } else {
      speak(t(lang, "quizNotSureAnswer"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      handleAsk();
    }
  };

  return (
    <div className="screen quiz-screen">
      <div className="thinking-emoji">🤫</div>
      <div className="question-card">
        <h2>{t(lang, "quizThinking")}</h2>
        <p>{t(lang, "quizQuestionsLeft", { count: questionsLeft })}</p>
      </div>

      {asked.length > 0 && (
        <div className="quiz-history">
          {asked.map((q, i) => (
            <div key={i} className="quiz-history-item">
              <span className="quiz-history-q">{q.displayQuestion}</span>
              <span className={`quiz-history-a quiz-a-${q.answer}`}>
                {q.answer === "yes" ? "✅" : q.answer === "no" ? "❌" : "🤷"}
              </span>
            </div>
          ))}
        </div>
      )}

      {questionsLeft > 0 && (
        <div className="quiz-input-row">
          <input
            className="learn-input"
            type="text"
            placeholder={t(lang, "quizTypePlaceholder")}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            className="btn btn-start quiz-ask-btn"
            disabled={!inputValue.trim()}
            onClick={handleAsk}
          >
            {t(lang, "quizAsk")}
          </button>
        </div>
      )}

      <button className="btn btn-start quiz-guess-btn" onClick={() => onGuess(asked.length)}>
        {t(lang, "quizWantToGuess")} ({asked.length}/{maxQuestions})
      </button>

      <button className="btn btn-reset" onClick={onRestart}>
        {t(lang, "startOver")}
      </button>
    </div>
  );
}
