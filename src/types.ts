export type QuestionNode = {
  type: "question";
  text: string;
  yes: TreeNode;
  no: TreeNode;
};

export type AnimalNode = {
  type: "answer";
  animal: string;
  emoji: string;
};

export type TreeNode = QuestionNode | AnimalNode;

export type GameMode = "classic" | "timer" | "quiz";

export type GamePhase =
  | "start"
  | "asking"
  | "guessing"
  | "celebration"
  | "learning"
  | "timer-expired"
  | "quiz-playing"
  | "quiz-guessing"
  | "quiz-result";

export interface AnimalRecord {
  animal: string;
  emoji: string;
  answers: Record<string, "yes" | "no">;
}
