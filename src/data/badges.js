// Badge definitions + (re-)export masteredCount for App.jsx

import { masteredCount } from "../utils/leitner.js";

export const BADGE_DEFS = [
  { id: "first-steps",  label: "First Steps",            rule: (s) => s.xp >= 10 },
  { id: "quiz-warrior", label: "Quiz Warrior",           rule: (s) => s.xp >= 100 },
  { id: "five-concepts", label: "5 Concepts Mastered",   rule: (s) => masteredCount(s.deck) >= 5 },
  { id: "ten-concepts",  label: "10 Concepts Mastered",  rule: (s) => masteredCount(s.deck) >= 10 },
  { id: "streak-3",      label: "3-Day Streak",          rule: (s) => (s.streak ?? 0) >= 3 },
];

// Let App.jsx keep importing both from "./data/badges"
export { masteredCount };
