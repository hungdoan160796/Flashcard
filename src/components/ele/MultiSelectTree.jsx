import React from "react";

/* ---------------- hooks ---------------- */
function useModal(open, onClose) {
  React.useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

function selectionReducer(state, action) {
  switch (action.type) {
    case "reset":       return new Set(action.ids);
    case "toggleOne": {
      const n = new Set(state);
      n.has(action.id) ? n.delete(action.id) : n.add(action.id);
      return n;
    }
    case "addMany": {
      const n = new Set(state);
      action.ids.forEach(id => n.add(id));
      return n;
    }
    case "removeMany": {
      const n = new Set(state);
      action.ids.forEach(id => n.delete(id));
      return n;
    }
    default:            return state;
  }
}

/* ---------------- utils ---------------- */
function normalizeIds(arr) {
  return arr.map(x => (x == null ? "" : String(x)));
}

/* ---------------- tri-state checkbox helper ---------------- */
function useIndeterminate(checked, indeterminate) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [checked, indeterminate]);
  return ref;
}

/* ---------------- component ---------------- */
export default function MultiSelectTree({
  folders = [],
  decks = [],
  selectedIds = [],
  onApply,
}) {
  const [open, setOpen] = React.useState(false);
  const [temp, dispatch] = React.useReducer(selectionReducer, new Set(selectedIds));
  const [openFolders, setOpenFolders] = React.useState(() => new Set()); // collapsed by default
  const panelRef = React.useRef(null);     // dialog panel
  const launcherRef = React.useRef(null);  // trigger button

  // sync external selection when closed
  React.useEffect(() => {
    if (!open) dispatch({ type: "reset", ids: selectedIds });
  }, [selectedIds, open]);

  useModal(open, () => setOpen(false));
  const closeAndReturnFocus = React.useCallback(() => {
    setOpen(false);
    // tidy up focus so space/enter won't accidentally re-open something else
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // return focus to launcher on next frame (after unmount animation)
    requestAnimationFrame(() => launcherRef.current?.focus?.({ preventScroll: true }));
  }, []);

  useModal(open, closeAndReturnFocus);

  // Close when clicking anywhere outside the dialog (or the launcher)
  React.useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e) => {
      const panel = panelRef.current;
      const launcher = launcherRef.current;
      if (!panel || !launcher) return;
      const t = e.target;
      const insidePanel = panel.contains(t);
      const onLauncher = launcher.contains(t);
      if (!insidePanel && !onLauncher) closeAndReturnFocus();
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [open, closeAndReturnFocus]);


  // Build folder → deck tree. Also synthesize "Unfiled" if needed.
  const { folderList, decksByFolder } = React.useMemo(() => {
    const byFolder = new Map(); // folderId (string|"") -> deck[]
    const folderIndex = new Map(folders.map(f => [String(f.id), f]));
    decks.forEach(d => {
      const key = d.folderId == null ? "" : String(d.folderId);
      if (!byFolder.has(key)) byFolder.set(key, []);
      byFolder.get(key).push(d);
    });

    const list = [];
    // Unfiled first if exists
    if (byFolder.has("")) list.push({ id: "", name: "Unfiled" });
    // Then real folders in input order
    folders.forEach(f => {
      if (byFolder.has(String(f.id))) list.push({ id: String(f.id), name: f.name });
    });

    return { folderList: list, decksByFolder: byFolder };
  }, [folders, decks]);

  const selectedDecks = React.useMemo(
    () => decks.filter(d => temp.has(String(d.id))),
    [decks, temp]
  );

  const label =
    selectedDecks.length === 0
      ? "Choose decks"
      : selectedDecks.length <= 2
      ? selectedDecks.map(s => s.name).join(", ")
      : `${selectedDecks.length} decks selected`;

  const toggleFolderOpen = (fid) => {
    setOpenFolders(prev => {
      const n = new Set(prev);
      n.has(fid) ? n.delete(fid) : n.add(fid);
      return n;
    });
  };

  const apply = () => {
    onApply(Array.from(temp));
    setOpen(false);
  };

  // Folder node (tri-state)
  function FolderRow({ folder }) {
    const fid = folder.id; // string|"" for Unfiled
    const decksInFolder = decksByFolder.get(fid) || [];
    const ids = normalizeIds(decksInFolder.map(d => d.id));

    const selectedCount = ids.reduce((acc, id) => acc + (temp.has(id) ? 1 : 0), 0);
    const allChecked = ids.length > 0 && selectedCount === ids.length;
    const someChecked = selectedCount > 0 && selectedCount < ids.length;

    const ref = useIndeterminate(allChecked, someChecked);

    const onFolderToggle = () => {
      if (allChecked) dispatch({ type: "removeMany", ids });
      else dispatch({ type: "addMany", ids });
    };

    const totalCards = decksInFolder.reduce((s, d) => s + (d.cards?.length ?? 0), 0);

    return (
      <section className="rounded-xl border border-slate-200 bg-white">
        <header className="flex items-center justify-between p-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              ref={ref}
              type="checkbox"
              className="size-4"
              checked={allChecked}
              onChange={onFolderToggle}
            />
            <div className="font-medium">
              {folder.name}
              <span className="ml-2 text-xs text-slate-500">
                {decksInFolder.length} decks · {totalCards} cards
              </span>
            </div>
          </label>

          <button
            type="button"
            className="text-xs px-2 py-1 rounded border"
            onClick={() => toggleFolderOpen(fid)}
          >
            {openFolders.has(fid) ? "Collapse" : "Expand"}
          </button>
        </header>

        {openFolders.has(fid) && (
          <ul className="divide-y">
            {decksInFolder.length === 0 ? (
              <li className="px-3 py-4 text-sm text-slate-500">No decks in this folder.</li>
            ) : (
              decksInFolder.map(d => {
                const id = String(d.id);
                const checked = temp.has(id);
                return (
                  <li key={id} className="flex items-center justify-between px-3 py-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={checked}
                        onChange={() => dispatch({ type: "toggleOne", id })}
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{d.name}</div>
                        <div className="text-xs text-slate-500">{d.cards?.length ?? 0} cards</div>
                      </div>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div className="relative">
      {/* Launcher */}
      <button
        type="button"
        ref={launcherRef}
        className="w-36 flex justify-between items-center gap-2 border rounded px-3 py-2 text-left"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0 text-xs text-slate-500">
          {selectedDecks.reduce((a, b) => a + (b.cards?.length ?? 0), 0)} cards
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeAndReturnFocus} />
          <div
            ref={panelRef}
            role="dialog" aria-modal="true" aria-label="Select decks"
            className="
  absolute inset-x-0 bottom-0 w-full max-w-full
  bg-white rounded-t-2xl shadow-lg flex flex-col max-h-[90dvh]

  md:fixed md:inset-auto md:top-40 md:left-1/2 md:-translate-x-1/2
  md:w-[720px] md:rounded-2xl md:max-h-[80vh] md:z-50 md:transform md:shadow-2xl md:border md:border-slate-200 md:w-1/3"
          >
            <div className="flex items-center justify-between gap-2 p-3 border-b">
              <div className="font-medium">Select decks</div>
            </div>

            <div className="overflow-auto p-3 space-y-3">
              {folderList.length === 0 ? (
                <div className="text-sm text-slate-500">No folders or decks yet.</div>
              ) : (
                folderList.map(f => <FolderRow key={f.id || "unfiled"} folder={f} />)
              )}
            </div>

            <div className="flex flex-col p-3 border-t gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded border"
                onClick={() => { dispatch({ type: "reset", ids: selectedIds }); closeAndReturnFocus(); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded bg-emerald-600 text-white"
                onClick={() => { apply(); closeAndReturnFocus(); }}
              >
                Apply ({temp.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
