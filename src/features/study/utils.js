export function getDeckArray(repo) {
  const decks = repo?.decks || [];
  return Array.isArray(decks) ? decks : Object.values(decks);
}

// Accepts EITHER:
//   toStudyCardsFromRepoDecks(selectedDecksArray, now?)
// OR
//   toStudyCardsFromRepoDecks(repoObject, deckIdArray, now?)
export function toStudyCardsFromRepoDecks(arg1, arg2, arg3) {
  let selectedDecks = [];
  let now = Date.now();

  // Form 1: (arrayOfDecks, now?)
  if (Array.isArray(arg1) && (!arg2 || typeof arg2 === "number")) {
    selectedDecks = arg1;
    if (typeof arg2 === "number") now = arg2;
  }
  // Form 2: (repoObject, deckIdArray, now?)
  else if (arg1 && typeof arg1 === "object" && (Array.isArray(arg2) || arg2 == null)) {
    const repo = arg1;
    const ids = new Set(Array.isArray(arg2) ? arg2 : []);
    const allDecks = getDeckArray(repo);
    selectedDecks = ids.size ? allDecks.filter(d => ids.has(d.id)) : allDecks;
    if (typeof arg3 === "number") now = arg3;
  }
  // Fallback: nothing valid
  else {
    selectedDecks = [];
  }

  const cards = [];
  for (const d of selectedDecks) {
    for (const c of (d?.cards || [])) {
      cards.push({
        id: crypto.randomUUID(),
        term: c.term ?? "",
        title: c.term ?? c.title ?? "",        // StudyView expects .title
        definition: c.definition ?? "",
        context: c.use ?? c.context ?? "",     // StudyView expects .context
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
