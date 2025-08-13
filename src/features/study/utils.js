export function getDeckArray(repo) {
  const decks = repo?.decks || [];
  return Array.isArray(decks) ? decks : Object.values(decks);
}

export function toStudyCardsFromRepoDecks(selectedDecks, now = Date.now()) {
  const cards = [];
  for (const d of selectedDecks) {
    for (const c of d.cards || []) {
      cards.push({
        id: crypto.randomUUID(),
        term: c.term ?? "",
        title: c.term ?? c.title ?? "",       // <- add title for StudyView
        definition: c.definition ?? "",
        context: c.use ?? c.context ?? "",    // <- add context for StudyView
        box: 1, learnedBox: 0, seen: 0, correct: 0, nextDue: now,
      });
    }
  }
  return cards;
}
