import React from "react";
import BASE_CONCEPTS from "../data/concepts";
import { loadRepo, saveRepo } from "../utils/storage";

function ensureUnfiledFolder(mutRepo) {
  const existing = Object.values(mutRepo.folders || {}).find(
    f => f.name?.toLowerCase() === "unfiled"
  );
  if (existing) return existing.id;
  const id = "unfiled";
  mutRepo.folders[id] = { id, name: "Unfiled" };
  return id;
}

export default function useRepo() {
  const [repo, setRepo] = React.useState(() => loadRepo());
  React.useEffect(() => { saveRepo(repo); }, [repo]);

  React.useEffect(() => {
    if (repo && repo.folders && Object.keys(repo.folders).length > 0) return;
    const r = { folders: {}, decks: {} };
    const unfiledId = ensureUnfiledFolder(r);
    const starterId = crypto.randomUUID();
    r.decks[starterId] = {
      id: starterId, name: "Starter Deck", folderId: unfiledId,
      createdAt: Date.now(), updatedAt: Date.now(),
      cards: BASE_CONCEPTS.map(c => ({
        id: crypto.randomUUID(),
        term: c.title ?? c.term ?? "",
        definition: c.definition ?? "",
        use: c.context ?? c.use ?? "",
      }))
    };
    setRepo(r);
  }, []);

  const foldersArr = React.useMemo(() => Object.values(repo?.folders || {}), [repo]);
  const decksArr = React.useMemo(() => Object.values(repo?.decks || {}), [repo]);

  const addFolder = (name = "New Folder") => {
    const id = crypto.randomUUID();
    setRepo(r => ({ ...r, folders: { ...(r.folders || {}), [id]: { id, name: name.trim() || "New Folder" } } }));
  };
  const renameFolder = (id, name) => setRepo(r => {
    const f = { ...(r.folders || {}) };
    if (f[id]) f[id] = { ...f[id], name: name.trim() || f[id].name };
    return { ...r, folders: f };
  });
  const deleteFolder = (id) => setRepo(r => {
    const folders = { ...(r.folders || {}) };
    const decks = { ...(r.decks || {}) };
    const unfiled = ensureUnfiledFolder(r);
    for (const d of Object.values(decks)) {
      if (d.folderId === id) decks[d.id] = { ...d, folderId: unfiled, updatedAt: Date.now() };
    }
    delete folders[id];
    return { folders, decks };
  });
  const moveDeck = (deckId, folderIdOrNull) => {
    setRepo((r) => {
      const decks = { ...(r.decks || {}) };
      const d = decks[deckId];
      if (!d) return r;
      decks[deckId] = { ...d, folderId: folderIdOrNull || null, updatedAt: Date.now() };
      return { ...r, decks };
    });
  };
  const createDeck = (draft) => {
    const id = crypto.randomUUID();
    const deck = {
      id, name: draft.name?.trim() || "Untitled deck",
      folderId: draft.folderId || null, createdAt: Date.now(), updatedAt: Date.now(),
      cards: (draft.cards || []).map(c => ({ id: crypto.randomUUID(), term: c.term || "", definition: c.definition || "", use: c.use || "" }))
    };
    setRepo(r => ({ ...r, decks: { ...(r.decks || {}), [id]: deck } }));
  };
  const updateDeck = (id, draft) => setRepo(r => {
    const cur = (r.decks || {})[id]; if (!cur) return r;
    const updated = {
      ...cur,
      name: draft.name?.trim() || cur.name,
      folderId: draft.folderId ?? cur.folderId,
      updatedAt: Date.now(),
      cards: (draft.cards || []).map(c => ({ id: c.id || crypto.randomUUID(), term: c.term || "", definition: c.definition || "", use: c.use || "" }))
    };
    return { ...r, decks: { ...(r.decks || {}), [id]: updated } };
  });
  const deleteDeck = (id) => setRepo(r => {
    const decks = { ...(r.decks || {}) }; delete decks[id]; return { ...r, decks };
  });

  return { repo, foldersArr, decksArr, addFolder, renameFolder, deleteFolder, moveDeck, createDeck, updateDeck, deleteDeck };
}
