// src/features/study/utils.js

// Accepts repo that may store decks as array or object map
export function getDeckArray(repo) {
  const decks = repo?.decks || [];
  return Array.isArray(decks) ? decks : Object.values(decks);
}

export function toStudyCardsFromRepoDecks(selectedDecks) {
  const now = Date.now();
  const cards = [];
  for (const d of selectedDecks) {
    for (const c of d.cards || []) {
      const id = crypto.randomUUID();
      cards.push({
        id,
        term: c.term ?? "",
        definition: c.definition ?? "",
        use: c.use ?? "",
        // spaced-repetition fields expected by StudyView/state
        box: 1,
        learnedBox: 0,
        seen: 0,
        correct: 0,
        nextDue: now,
      });
    }
  }
  return cards;
}
