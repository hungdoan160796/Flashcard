import React from "react";

/** Exams dashboard (scaffold)
 *  - Lets user choose folder(s) or deck(s) to take an exam
 *  - We’ll wire selection + start later
 */
export default function ExamsView({
  folders = [],
  decks = [],
  onStartExam, // (selectedFolderIds, selectedDeckIds) => void
}) {
  const [folderSel, setFolderSel] = React.useState(new Set());
  const [deckSel, setDeckSel] = React.useState(new Set());

  const toggle = (set, id) =>
    set((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Exam</h2>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="font-medium mb-2">Folders</div>
        {folders.length === 0 ? (
          <div className="text-sm text-slate-500">No folders.</div>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {folders.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={folderSel.has(f.id)}
                  onChange={() => toggle(setFolderSel, f.id)}
                />
                <span>{f.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="font-medium mb-2">Decks</div>
        {decks.length === 0 ? (
          <div className="text-sm text-slate-500">No decks.</div>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {decks.map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={deckSel.has(d.id)}
                  onChange={() => toggle(setDeckSel, d.id)}
                />
                <span>{d.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div>
        <button
          className="px-4 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50"
          onClick={() => onStartExam?.(Array.from(folderSel), Array.from(deckSel))}
          disabled={folderSel.size === 0 && deckSel.size === 0}
        >
          Start exam
        </button>
      </div>
    </div>
  );
}
