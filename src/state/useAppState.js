import { useState, useEffect } from "react";
import { loadState, saveState, todayStr } from "../utils/storage";
import BASE_CONCEPTS from "../data/concepts";
import { maybeUpdateStreakFields } from "../utils/leitner";

export default function useAppState() {
  const [state, setState] = useState(() => {
    const existing = loadState();
    if (existing) return { ...existing, ...maybeUpdateStreakFields(existing) };
    const deck = BASE_CONCEPTS.map((c) => ({ ...c, box: 1, nextDue: Date.now(), seen: 0, correct: 0 }));
    const s = { deck, xp: 0, streak: 0, lastActiveDate: todayStr(), badges: [] };
    saveState(s);
    return s;
  });

  useEffect(() => { saveState(state); }, [state]);
  return [state, setState];
}