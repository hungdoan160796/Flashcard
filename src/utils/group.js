// helpers for selecting groups and stable signatures
import { isMastered } from "./leitner.js";

export function deckSignature(deck) {
  return deck.length + ":" + deck.map((c) => c.id).join(",");
}

export function pickGroup(deck, { exclude = new Set(), size = 5 } = {}) {
  const A = deck.filter(
    (c) => !exclude.has(c.id) && c.box === 1 && ((c.learnedBox ?? 0) < 1) && !isMastered(c)
  );
  const B = deck.filter((c) => !exclude.has(c.id) && c.box === 2 && !isMastered(c));
  const C = deck.filter((c) => !exclude.has(c.id) && c.box === 3 && !isMastered(c));
  const byId = (a, b) => String(a.id).localeCompare(String(b.id));

  const out = [];
  for (const bucket of [A.sort(byId), B.sort(byId), C.sort(byId)]) {
    for (const c of bucket) {
      if (out.length >= size) break;
      out.push(c);
    }
    if (out.length >= size) break;
  }
  return out; // may be < size if not enough unmastered cards
}
