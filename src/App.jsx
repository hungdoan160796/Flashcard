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
import StudyDashboard from "./components/StudyDashboard.jsx";


export default function App() {

  const [dash, setDash] = React.useState(() =>
    localStorage.getItem("dash_last_v1") || Dashboard.STUDY
  );
  React.useEffect(() => {
    localStorage.setItem("dash_last_v1", dash);
  }, [dash]);

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
  const safeActiveIds = React.useMemo(
    () => Array.from(activeStudyDeckIds ?? []),
    [activeStudyDeckIds]
  );
  // Deck editor modal state (under Decks)
  const [deckEditor, setDeckEditor] = React.useState(null);
  // { mode: "create" } | { mode: "edit", id }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        title="Flashcard"
        xp={xp}
        streak={streak}
        overallPct={overallPctLearned}
        overallText={overallLearnedText}
        masteredPct={progressPctMastered}
        masteredText={progressMasteredText}
        badges={badges}
        value={dash}
        onChange={setDash}
        repo={repo}
        activeIds={safeActiveIds}
        setActiveIds={setActiveStudyDeckIds}
        deckCount={deckCount}
        onLoadFromRepo={(ids) => {
          const base = ids ?? activeStudyDeckIds;
          const typed = Array.from(base ?? []).map(String);
          console.log("[App] onLoadFromRepo ids:", typed);
          loadRepoDecksIntoStudy(repo, typed);
        }}
        onReset={() => {
          if (confirm("Reset all progress?")) resetAll();
        }}
      />

      <div className="max-w-8xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <Sidebar
            value={dash}
            onChange={setDash}
            repo={repo}
            activeIds={safeActiveIds}
            setActiveIds={setActiveStudyDeckIds}
            deckCount={deckCount}
            onLoadFromRepo={(ids) => {
              const base = ids ?? activeStudyDeckIds;
              const typed = Array.from(base ?? []).map(String);
              console.log("[App] onLoadFromRepo ids:", typed);
              loadRepoDecksIntoStudy(repo, typed);
            }}
          />

          <main className="flex-1">
            {dash === Dashboard.STUDY && (
              <StudyDashboard
                deck={deck}
                onLearn={onLearn}
                onQuiz={onQuiz}
                onMaster={onMaster}
              />
            )}

            {dash === Dashboard.FOLDERS && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 w-80 mx-auto">
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
              <section className="rounded-xl border border-slate-200 bg-white p-6 w-80 mx-auto">
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
              <section className="rounded-xl border border-slate-200 bg-white p-6 w-80 mx-auto">
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
          </main>
        </div>
      </div>
    </div>
  );
}
