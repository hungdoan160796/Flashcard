// src/views/Exams.jsx
import React from "react";

/**
 * Exams dashboard (stub)
 * - Accepts folders/decks as either arrays or map-objects ({id: obj})
 * - Multi-select folders and/or decks
 * - "Start exam" disabled until a selection exists
 *
 * Props:
 *  - folders: Folder[] | {[id]: Folder}
 *  - decks:   Deck[]   | {[id]: Deck}
 *  - onStartExam: (folderIds: string[], deckIds: string[]) => void
 */
export default function ExamsView({
  folders = [],
  decks = [],
  onStartExam,
}) {
  const foldersArr = React.useMemo(
    () => (Array.isArray(folders) ? folders : Object.values(folders || {})),
    [folders]
  );
  const decksArr = React.useMemo(
    () => (Array.isArray(decks) ? decks : Object.values(decks || {})),
    [decks]
  );

  // Precompute counts for nice labels
  const decksByFolder = React.useMemo(() => {
    const map = {};
    for (const d of decksArr) {
      const fid = d.folderId || "";
      if (!map[fid]) map[fid] = { deckCount: 0, cardCount: 0 };
      map[fid].deckCount += 1;
      map[fid].cardCount += (d.cards?.length ?? 0);
    }
    return map; // key: folderId ("" means Unfiled)
  }, [decksArr]);

  const deckCardCount = (deckId) => {
    const d = decksArr.find((x) => x.id === deckId);
    return d ? (d.cards?.length ?? 0) : 0;
  };

  const [folderSel, setFolderSel] = React.useState(new Set());
  const [deckSel, setDeckSel] = React.useState(new Set());

  const toggle = (setter, id) =>
    setter((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const clearAll = () => {
    setFolderSel(new Set());
    setDeckSel(new Set());
  };

  const canStart = folderSel.size > 0 || deckSel.size > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Exam</h2>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded border"
            onClick={clearAll}
          >
            Clear
          </button>
          <button
            className="px-3 py-1.5 rounded bg-slate-900 text-white disabled:opacity-50"
            disabled={!canStart}
            onClick={() =>
              onStartExam?.(Array.from(folderSel), Array.from(deckSel))
            }
          >
            Start exam
          </button>
        </div>
      </div>

      {/* Folders */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="font-medium mb-2">Folders</div>
        {foldersArr.length === 0 ? (
          <div className="text-sm text-slate-500">No folders.</div>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {foldersArr.map((f) => {
              const stats = decksByFolder[f.id] || { deckCount: 0, cardCount: 0 };
              return (
                <li key={f.id} className="flex items-center justify-between rounded border px-3 py-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={folderSel.has(f.id)}
                      onChange={() => toggle(setFolderSel, f.id)}
                    />
                    <span className="font-medium">{f.name}</span>
                  </label>
                  <span className="text-xs text-slate-500">
                    {stats.deckCount} decks • {stats.cardCount} cards
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Decks */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="font-medium mb-2">Decks</div>
        {decksArr.length === 0 ? (
          <div className="text-sm text-slate-500">No decks.</div>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {decksArr.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded border px-3 py-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={deckSel.has(d.id)}
                    onChange={() => toggle(setDeckSel, d.id)}
                  />
                  <span className="font-medium">{d.name}</span>
                </label>
                <span className="text-xs text-slate-500">
                  {d.cards?.length ?? 0} cards
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tiny hint */}
      <p className="text-xs text-slate-500">
        Tip: you can select both folders and individual decks. “Start exam” stays disabled until you select at least one.
      </p>
    </div>
  );
}
  