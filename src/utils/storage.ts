import type { TreeNode } from "../types";
import { defaultTree } from "../defaultTree";

const STORAGE_KEY = "guess-animal-tree";
const VERSION_KEY = "guess-animal-version";
const TREE_VERSION = "5"; // bump this when defaultTree changes

function countNodes(node: TreeNode): number {
  if (node.type === "answer") return 1;
  return countNodes(node.yes) + countNodes(node.no);
}

export function loadTree(): TreeNode {
  const savedVersion = localStorage.getItem(VERSION_KEY);
  const defaultCount = countNodes(defaultTree);

  if (savedVersion !== TREE_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(VERSION_KEY, TREE_VERSION);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as TreeNode;
      // If saved tree has fewer animals than default, reset
      if (countNodes(parsed) < defaultCount) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(VERSION_KEY, TREE_VERSION);
        return structuredClone(defaultTree);
      }
      return parsed;
    }
  } catch {
    // corrupted data, fall back to default
  }
  return structuredClone(defaultTree);
}

export function saveTree(tree: TreeNode): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
}

export function resetTree(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(VERSION_KEY, TREE_VERSION);
}
