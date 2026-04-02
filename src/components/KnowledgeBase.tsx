import { useMemo, useState } from "react";
import type { TreeNode } from "../types";
import type { Language } from "../utils/i18n";
import { t, tQuestion, tAnimal } from "../utils/i18n";

interface KnowledgeBaseProps {
  tree: TreeNode;
  lang: Language;
  onClose: () => void;
}

interface AnimalRecord {
  animal: string;
  emoji: string;
  answers: Record<string, "yes" | "no">;
}

function extractData(node: TreeNode, path: { question: string; answer: "yes" | "no" }[] = []): AnimalRecord[] {
  if (node.type === "answer") {
    const answers: Record<string, "yes" | "no"> = {};
    for (const step of path) {
      answers[step.question] = step.answer;
    }
    return [{ animal: node.animal, emoji: node.emoji, answers }];
  }
  return [
    ...extractData(node.yes, [...path, { question: node.text, answer: "yes" }]),
    ...extractData(node.no, [...path, { question: node.text, answer: "no" }]),
  ];
}

function collectQuestions(node: TreeNode): string[] {
  if (node.type === "answer") return [];
  const set = new Set<string>();
  set.add(node.text);
  for (const q of collectQuestions(node.yes)) set.add(q);
  for (const q of collectQuestions(node.no)) set.add(q);
  return [...set];
}

export function KnowledgeBase({ tree, lang, onClose }: KnowledgeBaseProps) {
  const [search, setSearch] = useState("");

  const { animals, questions } = useMemo(() => {
    const animals = extractData(tree).sort((a, b) => a.animal.localeCompare(b.animal));
    const questions = collectQuestions(tree);
    return { animals, questions };
  }, [tree]);

  const filtered = useMemo(() => {
    if (!search.trim()) return animals;
    const term = search.toLowerCase();
    return animals.filter((a) =>
      a.animal.toLowerCase().includes(term) ||
      a.emoji.includes(term) ||
      tAnimal(lang, a.animal).toLowerCase().includes(term)
    );
  }, [animals, search, lang]);

  return (
    <div className="kb-overlay" onClick={onClose}>
      <div className="kb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kb-header">
          <h2>{t(lang, "knowledgeBase")}</h2>
          <button className="kb-close" onClick={onClose}>✕</button>
        </div>
        <p className="kb-summary">
          {filtered.length}/{animals.length} {t(lang, "animals")} · {questions.length} {t(lang, "questions")}
        </p>
        <input
          className="kb-search"
          type="text"
          placeholder={`🔍 ${t(lang, "searchAnimals")}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="kb-table-wrap">
          <table className="kb-table">
            <thead>
              <tr>
                <th className="kb-sticky-col">{t(lang, "animal")}</th>
                {questions.map((q, i) => (
                  <th key={i} title={tQuestion(lang, q)}>
                    <div className="kb-q-header">{tQuestion(lang, q)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => (
                <tr key={rec.animal}>
                  <td className="kb-sticky-col kb-animal-cell">
                    <span>{rec.emoji}</span> {tAnimal(lang, rec.animal)}
                  </td>
                  {questions.map((q, i) => {
                    const val = rec.answers[q];
                    return (
                      <td key={i} className={`kb-cell ${val === "yes" ? "kb-yes" : val === "no" ? "kb-no" : "kb-na"}`}>
                        {val === "yes" ? "✅" : val === "no" ? "❌" : "·"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
