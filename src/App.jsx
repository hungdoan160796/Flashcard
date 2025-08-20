// src/App.jsx
import React from "react";

// Views
import FolderView from "./views/Folder.jsx";
import DecksView from "./views/Decks.jsx";
import ExamsView from "./views/Exams.jsx";
import AddDeckView from "./components/AddDeck.jsx";

// Shell pieces
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { Dashboard } from "./constants/dashboards.js";
import SwipeSnackDemo from "./components/ele/SwipeDetector";

// Study dashboard
import StudyView from "./views/LearnView.jsx";

// New: single hook that provides all state/actions
import useAppGlobals from "./hooks/useAppGlobals";

export default function App() {
  const {
    // nav
    dash, setDash,

    // repo
    repo, foldersArr, decksArr,
    addFolder, renameFolder, deleteFolder, moveDeck,
    createDeck, updateDeck, deleteDeck,

    // study runtime
    xp, streak, badges, deck, deckCount,
    overallPctLearned, overallLearnedText,
    progressPctMastered, progressMasteredText,
    onLearn, onQuiz, onMaster, resetAll, onLoadFromRepo,

    // active study selection
    safeActiveIds, setActiveStudyDeckIds,

    // deck editor modal
    deckEditor, setDeckEditor,
    study, // 👈 comes from useAppGlobals()
  } = useAppGlobals();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SwipeSnackDemo>
        {({ swipe }) => <div>Latest swipe: {swipe ?? "—"}</div>}
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
          onLoadFromRepo={onLoadFromRepo}
          onReset={() => {
            if (confirm("Reset all progress?")) resetAll();
          }}
        />

        <div className="max-w-8xl mx-auto px-4 py-6">
          <div className="flex gap-6 w-full">
            {({ swipe }) => (
              <Sidebar
                value={dash}
                onChange={setDash}
                repo={repo}
                activeIds={safeActiveIds}
                setActiveIds={setActiveStudyDeckIds}
                deckCount={deckCount}
                onLoadFromRepo={onLoadFromRepo}
                swipe={swipe}
              />
            )}
            <main className="flex-1 w-full">
              {dash === Dashboard.STUDY && (
                <StudyView {...study}></StudyView>
              )}

              {dash === Dashboard.FOLDERS && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 w-full mx-auto">
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
                <section className="rounded-xl border border-slate-200 bg-white p-6 w-full mx-auto">
                  {deckEditor ? (
                    <AddDeckView
                      mode={deckEditor.mode}
                      folders={foldersArr}
                      initial={
                        deckEditor.mode === "edit"
                          ? decksArr.find((d) => d.id === deckEditor.id) || { name: "", folderId: "", cards: [] }
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
                <section className="rounded-xl border border-slate-200 bg-white p-6 w-full mx-auto">
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
              <div id="modal-root" />
            </main>
          </div>
        </div>
      </SwipeSnackDemo>
    </div>
  );
}
