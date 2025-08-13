import React from "react";

/** Folders dashboard (scaffold)
 *  - Shows folders and the decks inside them
 *  - Actions coming next: add folder, delete folder (rules), move deck between folders
 */
export default function FolderView({
  folders = [],
  decks = [],
  onAddFolder,        // (name) => void
  onRenameFolder,     // (id, name) => void
  onDeleteFolder,     // (id) => void   (will enforce rules later)
  onMoveDeck,         // (deckId, folderId|null) => void
}) {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Folders</h2>
        <button
          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm"
          onClick={() => onAddFolder?.("New Folder")}
        >
          + Add folder
        </button>
      </header>

      {folders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
          No folders yet. Click “Add folder” to create your first one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {folders.map((f) => {
            const inFolder = decks.filter((d) => d.folderId === f.id);
            return (
              <section key={f.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">{f.name}</div>
                  <div className="flex gap-2">
                    <button
                      className="text-xs px-2 py-1 rounded border"
                      onClick={() => {
                        const name = prompt("Rename folder", f.name);
                        if (name) onRenameFolder?.(f.id, name);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded border"
                      onClick={() => onDeleteFolder?.(f.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {inFolder.length === 0 ? (
                  <div className="text-sm text-slate-500">No decks in this folder.</div>
                ) : (
                  <ul className="space-y-2">
                    {inFolder.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <div>
                          <div className="font-medium">{d.name}</div>
                          <div className="text-xs text-slate-500">{d.cards?.length ?? 0} cards</div>
                        </div>
                        <div>
                          <select
                            className="text-xs border rounded px-2 py-1"
                            value={d.folderId || ""}
                            onChange={(e) => onMoveDeck?.(d.id, e.target.value || null)}
                          >
                            <option value="">Unfiled</option>
                            {folders.map((ff) => (
                              <option key={ff.id} value={ff.id}>{ff.name}</option>
                            ))}
                          </select>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
