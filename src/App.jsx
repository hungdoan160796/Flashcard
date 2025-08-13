import React from "react";

// Views
import FolderView from "./views/Folder.jsx";
import DecksView from "./views/Decks.jsx";
import ExamsView from "./views/Exams.jsx";
import AddDeckView from "./views/AddDeck.jsx";

// Shell pieces
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { Dashboard } from "./constants/dashboards.js";

// Repo + Study hooks
import useRepo from "./hooks/useRepo";
import useActiveStudyDecks from "./hooks/useActiveStudyDecks";
import useStudyRuntime from "./hooks/useStudyRuntime";

// Study dashboard
import StudyDashboard from "./features/study/StudyDashboard";

function ensureUnfiledFolder(mutRepo) {
  const existing = Object.values(mutRepo.folders || {}).find(
    f => (f.name || "").toLowerCase() === "unfiled"
  );
  if (existing) return existing.id;
  const id = "unfiled";
  mutRepo.folders = mutRepo.folders || {};
  mutRepo.folders[id] = { id, name: "Unfiled" };
  return id;
}


export default function App() {
  const [dash, setDash] = React.useState(Dashboard.STUDY);

  // Repo (folders/decks) + CRUD
  const {
    repo, foldersArr, decksArr,
    addFolder, renameFolder, deleteFolder, moveDeck,
    createDeck, updateDeck, deleteDeck,
  } = useRepo();

  // Study runtime state & actions
  const {
    xp, streak, badges, deck, deckCount,
    overallPctLearned, overallLearnedText,
    progressPctMastered, progressMasteredText,
    onLearn, onQuiz, onMaster, resetAll, loadRepoDecksIntoStudy,
  } = useStudyRuntime();

  // Which repo deck IDs are active for Study
  const [activeStudyDeckIds, setActiveStudyDeckIds] = useActiveStudyDecks();

  // Deck editor modal state (under Decks)
  const [deckEditor, setDeckEditor] = React.useState(null);
  // { mode: "create" } | { mode: "edit", id }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        title="Flashcard"
        xp={xp}
        streak={streak}
        onReset={() => {
          if (confirm("Reset all progress?")) resetAll();
        }}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <Sidebar value={dash} onChange={setDash} />

          <main className="flex-1">
            {dash === Dashboard.STUDY && (
              <StudyDashboard
                deck={deck}
                repo={repo}
                activeIds={activeStudyDeckIds}
                setActiveIds={setActiveStudyDeckIds}
                deckCount={deckCount}
                overallPct={overallPctLearned}
                overallText={overallLearnedText}
                masteredPct={progressPctMastered}
                masteredText={progressMasteredText}
                badges={badges}
                onLoadFromRepo={() => loadRepoDecksIntoStudy(repo, activeStudyDeckIds)}
                onLearn={onLearn}
                onQuiz={onQuiz}
                onMaster={onMaster}
              />
            )}

            {dash === Dashboard.FOLDERS && (
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <FolderView
                  folders={foldersArr}
                  decks={decksArr}
                  onAddFolder={addFolder}
                  onRenameFolder={renameFolder}
                  onDeleteFolder={deleteFolder}
                  onMoveDeck={moveDeck}
                />
              </section>
            )}

            {dash === Dashboard.DECKS && (
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                {deckEditor ? (
                  <AddDeckView
                    mode={deckEditor.mode}
                    folders={foldersArr}
                    initial={
                      deckEditor.mode === "edit"
                        ? decksArr.find(d => d.id === deckEditor.id) || { name: "", folderId: "", cards: [] }
                        : { name: "", folderId: "", cards: [] }
                    }
                    onCancel={() => setDeckEditor(null)}
                    onSave={(draft) => {
                      if (deckEditor.mode === "edit") updateDeck(deckEditor.id, draft);
                      else createDeck(draft);
                      setDeckEditor(null);
                    }}
                  />
                ) : (
                  <DecksView
                    decks={decksArr}
                    onAddDeck={() => setDeckEditor({ mode: "create" })}
                    onEditDeck={(id) => setDeckEditor({ mode: "edit", id })}
                    onDeleteDeck={deleteDeck}
                  />
                )}
              </section>
            )}

            {dash === Dashboard.EXAM && (
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <ExamsView
                  folders={repo.folders}
                  decks={repo.decks}
                  onStartExam={(folderIds, deckIds) => {
                    alert(`Exam starting with:
Folders: ${folderIds.join(", ") || "(none)"}
Decks: ${deckIds.join(", ") || "(none)"}`);
                  }}
                />
              </section>
            )}

            <footer className="mt-10 text-xs text-slate-500">
              <p>Tip: Progress saves to this browser.</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
