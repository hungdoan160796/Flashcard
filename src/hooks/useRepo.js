// src/hooks/useRepo.js
import React from "react";
import BASE_CONCEPTS from "../data/concepts";
import { loadRepo, saveRepo } from "../utils/storage";

// Local helper: ensure an "Unfiled" folder exists, return its id
function ensureUnfiledFolder(mutRepo) {
  const existing = Object.values(mutRepo.folders || {}).find(
    (f) => f.name?.toLowerCase() === "unfiled"
  );
  if (existing) return existing.id;

  const id = "unfiled";
  mutRepo.folders[id] = { id, name: "Unfiled" };
  return id;
}

export default function useRepo() {
  const [repo, setRepo] = React.useState(() => loadRepo());

  // persist
  React.useEffect(() => {
    saveRepo(repo);
  }, [repo]);

  // first-run seed (object/map shape)
  React.useEffect(() => {
    if (repo && repo.folders && Object.keys(repo.folders).length > 0) return;

    const r = { folders: {}, decks: {} };
    const unfiledId = ensureUnfiledFolder(r);

    const starterDeckId = crypto.randomUUID();
    r.decks[starterDeckId] = {
      id: starterDeckId,
      name: "Starter Deck",
      folderId: unfiledId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      cards: BASE_CONCEPTS.map((c) => ({
        id: crypto.randomUUID(),
        term: c.title ?? c.term ?? "",
        definition: c.definition ?? "",
        use: c.context ?? c.use ?? "",
      })),
    };
    setRepo(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // convenience arrays
  const foldersArr = React.useMemo(() => Object.values(repo?.folders || {}), [repo]);
  const decksArr = React.useMemo(() => Object.values(repo?.decks || {}), [repo]);

  // Folder actions
  const addFolder = (name = "New Folder") => {
    const id = crypto.randomUUID();
    const f = { id, name: name.trim() || "New Folder" };
    setRepo((r) => ({ ...r, folders: { ...(r.folders || {}), [id]: f }, decks: r.decks || {} }));
  };

  const renameFolder = (id, name) => {
    setRepo((r) => {
      const folders = { ...(r.folders || {}) };
      if (folders[id]) folders[id] = { ...folders[id], name: name.trim() || folders[id].name };
      return { ...r, folders };
    });
  };

  const deleteFolder = (id) => {
    setRepo((r) => {
      const folders = { ...(r.folders || {}) };
      const decks = { ...(r.decks || {}) };
      const unfiledId = ensureUnfiledFolder(r);
      for (const d of Object.values(decks)) {
        if (d.folderId === id) decks[d.id] = { ...d, folderId: unfiledId, updatedAt: Date.now() };
      }
      delete folders[id];
      return { folders, decks };
    });
  };

  const moveDeck = (deckId, folderIdOrNull) => {
    setRepo((r) => {
      const decks = { ...(r.decks || {}) };
      const d = decks[deckId];
      if (!d) return r;
      decks[deckId] = { ...d, folderId: folderIdOrNull || null, updatedAt: Date.now() };
      return { ...r, decks };
    });
  };

  // Deck actions
  const createDeck = (draft) => {
    const deck = {
      id: crypto.randomUUID(),
      name: draft.name?.trim() || "Untitled deck",
      folderId: draft.folderId || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      cards: (draft.cards || []).map((c) => ({
        id: crypto.randomUUID(),
        term: c.term || "",
        definition: c.definition || "",
        use: c.use || "",
      })),
    };
    setRepo((r) => ({ ...r, decks: { ...(r.decks || {}), [deck.id]: deck } }));
  };

  const updateDeck = (id, draft) => {
    setRepo((r) => {
      const cur = (r.decks || {})[id];
      if (!cur) return r;
      const updated = {
        ...cur,
        name: draft.name?.trim() || cur.name,
        folderId: draft.folderId ?? cur.folderId,
        updatedAt: Date.now(),
        cards: (draft.cards || []).map((c) => ({
          id: c.id || crypto.randomUUID(),
          term: c.term || "",
          definition: c.definition || "",
          use: c.use || "",
        })),
      };
      return { ...r, decks: { ...(r.decks || {}), [id]: updated } };
    });
  };

  const deleteDeck = (id) => {
    setRepo((r) => {
      const decks = { ...(r.decks || {}) };
      delete decks[id];
      return { ...r, decks };
    });
  };

  return {
    repo,
    setRepo,
    foldersArr,
    decksArr,
    addFolder,
    renameFolder,
    deleteFolder,
    moveDeck,
    createDeck,
    updateDeck,
    deleteDeck,
  };
}
