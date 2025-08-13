// src/utils/leitner.js
import { todayStr } from "./storage.js"; // ← same folder, not ../utils

export const now = () => Date.now();

export const DAY = 24 * 60 * 60 * 1000;
// optional compatibility alias if some files import { day }
export const day = DAY;

export function scheduleNext(box) {
  const intervals = { 1: 1 * DAY, 2: 3 * DAY, 3: 10 * DAY };
  return now() + (intervals[box] ?? DAY);
}

export function toDeckCard(c) {
  return { ...c, box: 1, nextDue: now(), seen: 0, correct: 0 };
}

export function updateCard(s, id, change = {}) {
  const deck = s.deck.map((d) => {
    if (d.id !== id) return d;
    let box = d.box;
    if (typeof change.box === "number") box = change.box;
    if (change.promote) box = Math.min(3, box + 1);
    if (change.demote) box = 1;
    const nextDue = change.nextDue ?? scheduleNext(box);
    const correct = d.correct + (change.correctInc ?? 0);
    const seen = d.seen + (change.seenInc ?? 0);
    return { ...d, box, nextDue, correct, seen };
  });
  const xp = s.xp + (change.xpInc ?? 2);
  return { ...s, deck, xp, ...maybeUpdateStreakFields(s) };
}

export function masteredCount(deck) {
  return deck.filter((d) => d.box === 3 && d.correct >= 3).length;
}

export function maybeUpdateStreakFields(s) {
  const today = todayStr();
  if (!s.lastActiveDate) return { lastActiveDate: today, streak: 1 };
  if (s.lastActiveDate === today) return { lastActiveDate: today, streak: s.streak ?? 1 };

  const prev = new Date(s.lastActiveDate);
  const cur = new Date(today);
  const diffDays = Math.round((+cur - +prev) / DAY);
  const streak = diffDays === 1 ? (s.streak ?? 0) + 1 : 1;
  return { lastActiveDate: today, streak };
}

// ---- add to utils/leitner.js ----
export const MASTERED_CORRECT = 3;

export function isMastered(c) {
  // Mastered iff the final gate has been passed
  return c.mastered === true;
}

export function masteryProgress(c) {
  // Base progress by box: 1→0.33, 2→0.66, 3→0.9 (until gate)
  const base = Math.min(3, Math.max(1, c.box || 1));
  let p = (base - 1) / 3;
  if (c.mastered) return 1;          // full once gate passed
  // add a small quality term (up to +0.08) from correctness ratio
  return p;
}
