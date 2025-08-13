import React from "react";

/** Decks dashboard (scaffold)
 *  - Shows all decks flat (no folders)
 *  - Actions coming next: add, edit, delete deck
 */
export default function DecksView({
  decks = [],
  onAddDeck,     // () => void  (will open AddDeck view)
  onEditDeck,    // (deckId) => void
  onDeleteDeck,  // (deckId) => void
}) {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Decks</h2>
        <button
          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm"
          onClick={() => onAddDeck?.()}
        >
          + New deck
        </button>
      </header>

      {decks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
          No decks yet. Click “New deck” to create one.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {decks.map((d) => (
            <li key={d.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-slate-500">
                    {d.cards?.length ?? 0} cards • updated {new Date(d.updatedAt || d.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs px-2 py-1 rounded border" onClick={() => onEditDeck?.(d.id)}>
                    Edit
                  </button>
                  <button className="text-xs px-2 py-1 rounded border" onClick={() => onDeleteDeck?.(d.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
