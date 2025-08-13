const LS_KEY = "da-trainer-state-v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(s) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}


// --- simple repo for folders & decks ---
const KEY = "repo_v1";

export function loadRepo() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // seed
  const repo = {
    folders: {
      unfiled: { id: "unfiled", name: "Unfiled", deckIds: [] },
    },
    decks: {},
  };
  saveRepo(repo);
  return repo;
}

export function saveRepo(repo) {
  localStorage.setItem(KEY, JSON.stringify(repo));
}

export function ensureUnfiledFolder(repo) {
  if (!repo.folders) repo.folders = {};
  if (!repo.folders.unfiled) {
    repo.folders.unfiled = { id: "unfiled", name: "Unfiled", deckIds: [] };
    saveRepo(repo);
  }
  return repo.folders.unfiled.id;
}
