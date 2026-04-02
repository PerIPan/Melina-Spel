import { useState, useCallback, useEffect } from "react";
import type { TreeNode, GamePhase, GameMode, AnimalNode, AnimalRecord } from "./types";
import type { Language } from "./utils/i18n";
import { LANGUAGES, t, getSpeechLang } from "./utils/i18n";
import { loadTree, saveTree } from "./utils/storage";
import { playClick, playCorrect, playWrong, playLearn, playTimerTick, playTimerExpired } from "./utils/sounds";
import { setLanguage } from "./utils/speech";
import { useTimer } from "./hooks/useTimer";
import { pickRandomAnimal } from "./utils/quiz";
import { StartScreen } from "./components/StartScreen";
import { QuestionScreen } from "./components/QuestionScreen";
import { GuessScreen } from "./components/GuessScreen";
import { CelebrationScreen } from "./components/CelebrationScreen";
import { LearnScreen } from "./components/LearnScreen";
import { KnowledgeBase } from "./components/KnowledgeBase";
import { TimerBar } from "./components/TimerBar";
import { TimerExpiredScreen } from "./components/TimerExpiredScreen";
import { QuizScreen } from "./components/QuizScreen";
import { QuizGuessScreen } from "./components/QuizGuessScreen";
import { QuizResultScreen } from "./components/QuizResultScreen";
import "./AnimalApp.css";

// === Animal Sticker System ===
interface AnimalSticker {
  id: string;
  emoji: string;
  name: string;
}

const ANIMAL_STICKERS: AnimalSticker[] = [
  { id: "first_guess", emoji: "🎯", name: "Eerste Keer Raak" },
  { id: "guess_5", emoji: "🧠", name: "Slimme Kop" },
  { id: "guess_10", emoji: "🔮", name: "Gedachtelezer" },
  { id: "guess_25", emoji: "🧙", name: "Dieren Tovenaar" },
  { id: "first_teach", emoji: "📚", name: "Leraar" },
  { id: "teach_3", emoji: "🎓", name: "Professor" },
  { id: "teach_10", emoji: "🏫", name: "Schoolhoofd" },
  { id: "first_quiz", emoji: "🎲", name: "Quiz Starter" },
  { id: "quiz_5", emoji: "🕵️", name: "Detective" },
  { id: "timer_win", emoji: "⏱️", name: "Snelheidsduivel" },
];

interface AnimalStats {
  guesses: number;
  teaches: number;
  quizWins: number;
  timerWins: number;
}

function loadAnimalStats(): AnimalStats {
  try {
    const saved = localStorage.getItem("animalStats");
    return saved ? JSON.parse(saved) : { guesses: 0, teaches: 0, quizWins: 0, timerWins: 0 };
  } catch { return { guesses: 0, teaches: 0, quizWins: 0, timerWins: 0 }; }
}

function saveAnimalStats(stats: AnimalStats): void {
  localStorage.setItem("animalStats", JSON.stringify(stats));
}

function loadAnimalStickers(): string[] {
  try {
    const saved = localStorage.getItem("animalStickers");
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveAnimalStickers(ids: string[]): void {
  localStorage.setItem("animalStickers", JSON.stringify(ids));
}

function checkNewStickers(stats: AnimalStats, earned: string[]): AnimalSticker | null {
  const checks: [string, boolean][] = [
    ["first_guess", stats.guesses >= 1],
    ["guess_5", stats.guesses >= 5],
    ["guess_10", stats.guesses >= 10],
    ["guess_25", stats.guesses >= 25],
    ["first_teach", stats.teaches >= 1],
    ["teach_3", stats.teaches >= 3],
    ["teach_10", stats.teaches >= 10],
    ["first_quiz", stats.quizWins >= 1],
    ["quiz_5", stats.quizWins >= 5],
    ["timer_win", stats.timerWins >= 1],
  ];
  for (const [id, condition] of checks) {
    if (condition && !earned.includes(id)) {
      return ANIMAL_STICKERS.find(s => s.id === id) || null;
    }
  }
  return null;
}

function countAnimals(node: TreeNode): number {
  if (node.type === "answer") return 1;
  return countAnimals(node.yes) + countAnimals(node.no);
}

function findAndReplace(
  root: TreeNode,
  path: ("yes" | "no")[],
  newNode: TreeNode
): TreeNode {
  const clone = JSON.parse(JSON.stringify(root)) as TreeNode;
  if (path.length === 0) return newNode;

  let current = clone;
  for (let i = 0; i < path.length - 1; i++) {
    if (current.type === "question") {
      current = current[path[i]];
    }
  }
  if (current.type === "question") {
    const lastStep = path[path.length - 1];
    current[lastStep] = newNode;
  }
  return clone;
}

const COLOR_THEMES = [
  { name: "Purple", colors: ["#667eea", "#764ba2"], emoji: "💜" },
  { name: "Ocean", colors: ["#2193b0", "#6dd5ed"], emoji: "🌊" },
  { name: "Sunset", colors: ["#f7971e", "#ffd200"], emoji: "🌅" },
  { name: "Forest", colors: ["#134e5e", "#71b280"], emoji: "🌲" },
  { name: "Pink", colors: ["#ee9ca7", "#ffdde1"], emoji: "🌸" },
  { name: "Fire", colors: ["#f12711", "#f5af19"], emoji: "🔥" },
  { name: "Space", colors: ["#0f0c29", "#302b63"], emoji: "🌌" },
  { name: "Candy", colors: ["#ff6a88", "#ff99ac"], emoji: "🍬" },
  { name: "Mint", colors: ["#00b09b", "#96c93d"], emoji: "🍃" },
  { name: "Galaxy", colors: ["#654ea3", "#eaafc8"], emoji: "✨" },
];

const QUIZ_MAX_QUESTIONS = 10;

export default function App() {
  const [tree, setTree] = useState<TreeNode>(loadTree);
  const [currentNode, setCurrentNode] = useState<TreeNode>(tree);
  const [path, setPath] = useState<("yes" | "no")[]>([]);
  const [phase, setPhase] = useState<GamePhase>("start");
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [showColors, setShowColors] = useState(false);
  const [showLangs, setShowLangs] = useState(false);
  const [showKB, setShowKB] = useState(false);
  const [animalStats, setAnimalStats] = useState<AnimalStats>(loadAnimalStats);
  const [earnedAnimalStickers, setEarnedAnimalStickers] = useState<string[]>(loadAnimalStickers);
  const [newAnimalSticker, setNewAnimalSticker] = useState<AnimalSticker | null>(null);
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("guess-animal-lang") as Language) || "en";
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("guess-animal-dark") === "true";
  });

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(60);
  const timerEnabled = gameMode === "timer" && (phase === "asking" || phase === "guessing");
  const timer = useTimer(timerSeconds, timerEnabled);

  // Quiz state
  const [quizAnimal, setQuizAnimal] = useState<AnimalRecord | null>(null);
  const [quizQuestionsAsked, setQuizQuestionsAsked] = useState(0);
  const [quizGuessCorrect, setQuizGuessCorrect] = useState(false);

  // Timer tick sound for last 10 seconds
  useEffect(() => {
    if (timerEnabled && timer.secondsLeft <= 10 && timer.secondsLeft > 0) {
      playTimerTick();
    }
  }, [timerEnabled, timer.secondsLeft]);

  // Timer expired
  useEffect(() => {
    if (timer.isExpired && timerEnabled) {
      playTimerExpired();
      setPhase("timer-expired");
    }
  }, [timer.isExpired, timerEnabled]);

  // Pause timer during learning
  useEffect(() => {
    if (phase === "learning") {
      timer.pause();
    } else if (gameMode === "timer" && (phase === "asking" || phase === "guessing")) {
      timer.resume();
    }
  }, [phase, gameMode, timer]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("guess-animal-dark", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem("guess-animal-colors");
    if (saved) {
      const [c1, c2] = JSON.parse(saved) as string[];
      document.documentElement.style.setProperty("--bg-gradient-1", c1);
      document.documentElement.style.setProperty("--bg-gradient-2", c2);
    }
  }, []);

  useEffect(() => {
    setLanguage(getSpeechLang(lang));
    localStorage.setItem("guess-animal-lang", lang);
  }, [lang]);

  const pickColor = (colors: string[]) => {
    document.documentElement.style.setProperty("--bg-gradient-1", colors[0]);
    document.documentElement.style.setProperty("--bg-gradient-2", colors[1]);
    localStorage.setItem("guess-animal-colors", JSON.stringify(colors));
    setShowColors(false);
  };

  const pickLang = (newLang: Language) => {
    setLang(newLang);
    setShowLangs(false);
  };

  const animalCount = countAnimals(tree);

  const handleGoHome = useCallback(() => {
    playClick();
    setPhase("start");
    setGameMode("classic");
  }, []);

  // Classic mode start
  const handleStartClassic = useCallback(() => {
    playClick();
    setGameMode("classic");
    const freshTree = loadTree();
    setTree(freshTree);
    setCurrentNode(freshTree);
    setPath([]);
    setPhase("asking");
  }, []);

  // Timer mode start
  const handleStartTimer = useCallback((seconds: number) => {
    playClick();
    setGameMode("timer");
    setTimerSeconds(seconds);
    timer.reset(seconds);
    const freshTree = loadTree();
    setTree(freshTree);
    setCurrentNode(freshTree);
    setPath([]);
    setPhase("asking");
  }, [timer]);

  // Quiz mode start
  const handleStartQuiz = useCallback(() => {
    playClick();
    setGameMode("quiz");
    const freshTree = loadTree();
    setTree(freshTree);
    const secret = pickRandomAnimal(freshTree);
    setQuizAnimal(secret);
    setQuizQuestionsAsked(0);
    setPhase("quiz-playing");
  }, []);

  const handleAnswer = useCallback(
    (answer: "yes" | "no") => {
      playClick();
      if (currentNode.type === "question") {
        const next = currentNode[answer];
        const newPath = [...path, answer];
        setPath(newPath);
        if (next.type === "answer") {
          setCurrentNode(next);
          setPhase("guessing");
        } else {
          setCurrentNode(next);
        }
      }
    },
    [currentNode, path]
  );

  const handleNotSure = useCallback(() => {
    playClick();
    const random = Math.random() < 0.5 ? "yes" : "no";
    handleAnswer(random);
  }, [handleAnswer]);

  const awardSticker = useCallback((updatedStats: AnimalStats) => {
    saveAnimalStats(updatedStats);
    setAnimalStats(updatedStats);
    const sticker = checkNewStickers(updatedStats, earnedAnimalStickers);
    if (sticker) {
      const updated = [...earnedAnimalStickers, sticker.id];
      setEarnedAnimalStickers(updated);
      saveAnimalStickers(updated);
      setNewAnimalSticker(sticker);
    }
  }, [earnedAnimalStickers]);

  const handleGuessCorrect = useCallback(() => {
    playCorrect();
    const isTimer = gameMode === "timer";
    const updated = {
      ...animalStats,
      guesses: animalStats.guesses + 1,
      timerWins: isTimer ? animalStats.timerWins + 1 : animalStats.timerWins,
    };
    awardSticker(updated);
    setPhase("celebration");
  }, [animalStats, gameMode, awardSticker]);

  const handleGuessWrong = useCallback(() => {
    playWrong();
    setPhase("learning");
  }, []);

  const handleLearn = useCallback(
    (newAnimal: string, newQuestion: string, answerIsYes: boolean) => {
      playLearn();
      const oldAnimal = currentNode as AnimalNode;

      const newQuestionNode: TreeNode = {
        type: "question",
        text: newQuestion,
        yes: answerIsYes
          ? { type: "answer", animal: newAnimal, emoji: "🐾" }
          : oldAnimal,
        no: answerIsYes
          ? oldAnimal
          : { type: "answer", animal: newAnimal, emoji: "🐾" },
      };

      const newTree = findAndReplace(tree, path, newQuestionNode);
      setTree(newTree);
      saveTree(newTree);

      const updated = { ...animalStats, teaches: animalStats.teaches + 1 };
      awardSticker(updated);

      setPhase("start");
    },
    [tree, path, currentNode, animalStats, awardSticker]
  );

  // Quiz: player wants to guess
  const handleQuizGuess = useCallback((askedCount: number) => {
    playClick();
    setQuizQuestionsAsked(askedCount);
    setPhase("quiz-guessing");
  }, []);

  // Quiz: player submits guess
  const handleQuizSubmitGuess = useCallback(
    (guess: string) => {
      if (!quizAnimal) return;
      const correct = guess.toLowerCase().trim() === quizAnimal.animal.toLowerCase().trim();
      setQuizGuessCorrect(correct);
      if (correct) {
        playCorrect();
        const updated = { ...animalStats, quizWins: animalStats.quizWins + 1 };
        awardSticker(updated);
      } else {
        playWrong();
      }
      setPhase("quiz-result");
    },
    [quizAnimal, animalStats, awardSticker]
  );

  // Quiz: go back to questions
  const handleQuizBack = useCallback(() => {
    playClick();
    setPhase("quiz-playing");
  }, []);

  const handleRestart = useCallback(() => {
    playClick();
    if (gameMode === "timer") {
      timer.reset(timerSeconds);
      const freshTree = loadTree();
      setTree(freshTree);
      setCurrentNode(freshTree);
      setPath([]);
      setPhase("asking");
    } else if (gameMode === "quiz") {
      handleStartQuiz();
    } else {
      handleStartClassic();
    }
  }, [gameMode, timerSeconds, timer, handleStartClassic, handleStartQuiz]);

  return (
    <div className="app">
      <div className="corner-label">{t(lang, "cornerLabel")}</div>
      <div className="top-buttons">
        <button
          className="top-btn"
          onClick={() => { setShowKB(true); setShowColors(false); setShowLangs(false); }}
          title="Knowledge Base"
        >
          📊
        </button>
        <button
          className="top-btn"
          onClick={() => { setShowLangs((s) => !s); setShowColors(false); }}
          title="Language"
        >
          {LANGUAGES.find((l) => l.code === lang)?.flag}
        </button>
        <button
          className="top-btn"
          onClick={() => { setShowColors((s) => !s); setShowLangs(false); }}
          title="Pick a color"
        >
          🎨
        </button>
        <button
          className="top-btn"
          onClick={() => setDarkMode((d) => !d)}
          title="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
      {showLangs && (
        <div className="lang-picker">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={`lang-option ${l.code === lang ? "active" : ""}`}
              onClick={() => pickLang(l.code)}
            >
              <span className="lang-flag">{l.flag}</span>
              <span className="lang-name">{l.name}</span>
            </button>
          ))}
        </div>
      )}
      {showColors && (
        <div className="color-picker">
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.name}
              className="color-swatch"
              style={{
                background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`,
              }}
              onClick={() => pickColor(theme.colors)}
              title={theme.name}
            >
              {theme.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Timer bar */}
      {gameMode === "timer" && phase !== "start" && phase !== "timer-expired" && phase !== "celebration" && (
        <TimerBar secondsLeft={timer.secondsLeft} totalSeconds={timerSeconds} />
      )}

      {phase === "start" && (
        <StartScreen
          onStartClassic={handleStartClassic}
          onStartTimer={handleStartTimer}
          onStartQuiz={handleStartQuiz}
          animalCount={animalCount}
          lang={lang}
        />
      )}
      {phase === "asking" && currentNode.type === "question" && (
        <QuestionScreen
          question={currentNode.text}
          onYes={() => handleAnswer("yes")}
          onNo={() => handleAnswer("no")}
          onNotSure={handleNotSure}
          onRestart={handleGoHome}
          lang={lang}
        />
      )}
      {phase === "guessing" && currentNode.type === "answer" && (
        <GuessScreen
          animal={currentNode.animal}
          emoji={currentNode.emoji}
          onYes={handleGuessCorrect}
          onNo={handleGuessWrong}
          onRestart={handleGoHome}
          lang={lang}
        />
      )}
      {phase === "celebration" && currentNode.type === "answer" && (
        <CelebrationScreen
          animal={currentNode.animal}
          emoji={currentNode.emoji}
          onPlayAgain={handleRestart}
          lang={lang}
        />
      )}
      {phase === "learning" && currentNode.type === "answer" && (
        <LearnScreen
          wrongAnimal={currentNode.animal}
          wrongEmoji={currentNode.emoji}
          onLearn={handleLearn}
          lang={lang}
        />
      )}
      {phase === "timer-expired" && (
        <TimerExpiredScreen onPlayAgain={handleGoHome} lang={lang} />
      )}
      {phase === "quiz-playing" && quizAnimal && (
        <QuizScreen
          secretAnimal={quizAnimal}
          tree={tree}
          maxQuestions={QUIZ_MAX_QUESTIONS}
          onGuess={handleQuizGuess}
          onRestart={handleGoHome}
          lang={lang}
        />
      )}
      {phase === "quiz-guessing" && (
        <QuizGuessScreen
          onSubmitGuess={handleQuizSubmitGuess}
          onBack={handleQuizBack}
          lang={lang}
        />
      )}
      {phase === "quiz-result" && quizAnimal && (
        <QuizResultScreen
          correct={quizGuessCorrect}
          secretAnimal={quizAnimal.animal}
          secretEmoji={quizAnimal.emoji}
          questionsAsked={quizQuestionsAsked}
          onPlayAgain={handleGoHome}
          lang={lang}
        />
      )}
      {showKB && (
        <KnowledgeBase tree={tree} lang={lang} onClose={() => setShowKB(false)} />
      )}

      {/* Sticker popup */}
      {newAnimalSticker && (
        <div className="animal-sticker-overlay">
          <div className="animal-sticker-popup" onClick={e => e.stopPropagation()}>
            <div className="animal-sticker-emoji">{newAnimalSticker.emoji}</div>
            <h2 className="animal-sticker-title">Nieuwe Sticker!</h2>
            <p className="animal-sticker-name">{newAnimalSticker.name}</p>
            <div className="animal-sticker-buttons">
              <button className="btn btn-start" onClick={() => setNewAnimalSticker(null)}>
                Houden!
              </button>
              <button className="btn btn-reset" onClick={() => {
                const updated = earnedAnimalStickers.filter(id => id !== newAnimalSticker.id);
                setEarnedAnimalStickers(updated);
                saveAnimalStickers(updated);
                setNewAnimalSticker(null);
              }}>
                Nee bedankt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
