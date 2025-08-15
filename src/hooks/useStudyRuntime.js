import React from "react";
import BASE_CONCEPTS from "../data/concepts";
import { BADGE_DEFS, masteredCount } from "../data/badges";
import { loadState, saveState, todayStr } from "../utils/storage";
import { maybeUpdateStreakFields, DAY } from "../utils/leitner";
import { getDeckArray, toStudyCardsFromRepoDecks } from "../utils/utils";

export default function useStudyRuntime() {
  const [state, setState] = React.useState(() => {
    const existing = loadState();
    if (existing) {
      const migratedDeck = (existing.deck || []).map(c => ({ ...c, learnedBox: c.learnedBox ?? 0 }));
      const s = { ...existing, deck: migratedDeck, ...maybeUpdateStreakFields(existing) };
      saveState(s);               // write back the migrated shape
      return s;
    }
    // first-time: empty deck; will be filled when you click "Load to Study"
    const s = { deck: [], xp: 0, streak: 0, lastActiveDate: todayStr(), badges: [] };
    saveState(s);
    return s;
  });

  React.useEffect(() => { saveState(state); }, [state]);

  React.useEffect(() => {
    const newlyEarned = BADGE_DEFS.filter(b => b.rule(state))
      .filter(b => !state.badges.includes(b.id));
    if (newlyEarned.length) {
      setState(s => ({ ...s, badges: [...s.badges, ...newlyEarned.map(b => b.id)] }));
    }
  }, [state.xp, state.deck, state.streak]); // eslint-disable-line

  const progress = React.useMemo(() => {
    const mastered = masteredCount(state.deck);
    return {
      total: state.deck.length,
      mastered,
      pctMastered: Math.round((mastered / Math.max(1, state.deck.length)) * 100),
    };
  }, [state.deck]);

  const overall = React.useMemo(() => {
    const total = state.deck.length || 1;
    const learnedPlus = state.deck.filter(c => (c.box ?? 1) >= 2).length;
    return { total, learnedPlus, pctLearned: Math.round((learnedPlus / total) * 100) };
  }, [state.deck]);

  // public handlers for StudyView
  const onLearn = (id) => {
    setState(s => {
      const deck = s.deck.map(c =>
        c.id === id
          ? { ...c, learnedBox: Math.max(1, c.learnedBox ?? 0), box: 2, seen: c.seen + 1, nextDue: Date.now() + DAY }
          : c
      );
      return { ...s, deck, xp: s.xp + 2 };
    });
  };


  const onQuiz = (id, correct) => {
    setState(s => {
      const deck = s.deck.map(c => {
        if (c.id !== id) return c;
        return correct
          ? { ...c, box: 3, seen: c.seen + 1, correct: c.correct + 1 }
          : { ...c, box: 1, learnedBox: 0, seen: c.seen + 1 }; // deferred demotion behavior
      });
      return { ...s, deck };
    });
  };

  const onMaster = (id, correct) => {
    setState(s => {
      const deck = s.deck.map(c =>
        c.id === id
          ? {
            ...c,
            seen: c.seen + 1,
            correct: c.correct + (correct ? 1 : 0),
            mastered: correct ? true : c.mastered || false,
            box: correct ? c.box : 2, // deferred demotion
          }
          : c
      );
      return { ...s, deck, xp: s.xp + (correct ? 8 : 2) };
    });
  };

  const resetAll = () => {
    const s = { deck: [], xp: 0, streak: 0, lastActiveDate: todayStr(), badges: [] };
    setState(s); // persisted by effect
  };

  const loadRepoDecksIntoStudy = (repo, deckIds) => {
    const idSet = new Set((deckIds ?? []).map(String));
    const selectedDecks = Object.values(repo.decks || {}).filter(
      (d) => idSet.has(String(d.id))
    );
    const studyCards = toStudyCardsFromRepoDecks(selectedDecks);
    setState(s => ({ ...s, deck: studyCards, lastActiveDate: todayStr() }));
  };

  return {
    state,
    deck: state.deck,
    xp: state.xp,
    streak: state.streak,
    badges: state.badges,
    deckCount: state.deck.length,
    progressPctMastered: progress.pctMastered,
    progressMasteredText: `${progress.mastered}/${progress.total} mastered`,
    overallPctLearned: overall.pctLearned,
    overallLearnedText: `${overall.learnedPlus}/${overall.total} learned or higher`,
    onLearn, onQuiz, onMaster, resetAll, loadRepoDecksIntoStudy,
  };
}
