import React from "react";

// Dashboards & views
import FolderView from "./views/Folder.jsx";
import DecksView from "./views/Decks.jsx";
import ExamsView from "./views/Exams.jsx";
import StudyView from "./views/LearnView";
import AddDeckView from "./views/AddDeck.jsx";

// UI bits
import XPBadge from "./components/XPBadge";
import StreakBadge from "./components/StreakBadge";
import ProgressBar from "./components/ProgressBar";
import BadgesRow from "./components/BadgesRow";
import NavItem from "./components/NavItem";

// State/helpers
import { loadState, saveState, todayStr } from "./utils/storage";
import { BADGE_DEFS, masteredCount } from "./data/badges";
import BASE_CONCEPTS from "./data/concepts";
import { maybeUpdateStreakFields, DAY } from "./utils/leitner";

// New bits
import { Dashboard } from "./constants/dashboards";
import useActiveStudyDecks from "./hooks/useActiveStudyDecks";
import useRepo from "./hooks/useRepo";
import StudySelector from "./features/study/StudySelector";
import { getDeckArray, toStudyCardsFromRepoDecks } from "./features/study/utils";

export default function App() {
  // Study runtime state (XP, streak, current in-memory deck used by Learn/Quiz/Master)
  const [state, setState] = React.useState(() => {
    const existing = loadState();
    if (existing) {
      const migratedDeck = existing.deck.map((c) => ({ ...c, learnedBox: c.learnedBox ?? 0 }));
      const s = { ...existing, deck: migratedDeck, ...maybeUpdateStreakFields(existing) };
      saveState(s);
      return s;
    }
    const deck = BASE_CONCEPTS.map((c) => ({
      ...c,
      box: 1,
      nextDue: Date.now(),
      seen: 0,
      correct: 0,
      learnedBox: 0,
    }));
    const s = { deck, xp: 0, streak: 0, lastActiveDate: todayStr(), badges: [] };
    saveState(s);
    return s;
  });

  // Dashboard tab
  const [dash, setDash] = React.useState(Dashboard.STUDY);

  // Active deck ids for Study (persists to LS)
  const [activeStudyDeckIds, setActiveStudyDeckIds] = useActiveStudyDecks();

  // Persist study runtime + earn badges
  React.useEffect(() => { saveState(state); }, [state]);

  React.useEffect(() => {
    const newlyEarned = BADGE_DEFS
      .filter((b) => b.rule(state))
      .filter((b) => !state.badges.includes(b.id));
    if (newlyEarned.length) {
      setState((s) => ({ ...s, badges: [...s.badges, ...newlyEarned.map((b) => b.id)] }));
    }
  }, [state.xp, state.deck, state.streak]);

  // Derived progress bars
  const progress = React.useMemo(() => {
    const mastered = masteredCount(state.deck);
    return {
      total: state.deck.length,
      mastered,
      pct: Math.round((mastered / state.deck.length) * 100),
    };
  }, [state.deck]);

  const overall = React.useMemo(() => {
    const total = state.deck.length || 1;
    const learnedPlus = state.deck.filter((c) => (c.box ?? 1) >= 2).length;
    return { total, learnedPlus, pct: Math.round((learnedPlus / total) * 100) };
  }, [state.deck]);

  // Repo (folders & decks) + actions
  const {
    repo,
    foldersArr,
    decksArr,
    addFolder,
    renameFolder,
    deleteFolder,
    moveDeck,
    createDeck,
    updateDeck,
    deleteDeck,
  } = useRepo();

  // Deck editor modal state (under Decks dashboard)
  const [deckEditor, setDeckEditor] = React.useState(null);
  // deckEditor = { mode: "create" } | { mode: "edit", id }

  function applyStudySelectionFromRepo() {
    const chosen = getDeckArray(repo).filter((d) => activeStudyDeckIds.includes(d.id));
    const studyCards = toStudyCardsFromRepoDecks(chosen);
    setState((s) => ({
      ...s,
      deck: studyCards,
      xp: s.xp,
      streak: s.streak,
      lastActiveDate: todayStr(),
    }));
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Flashcard</h1>
          <div className="flex items-center gap-3">
            <XPBadge xp={state.xp} />
            <StreakBadge streak={state.streak} />
            <button
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
              onClick={() => {
                if (confirm("Reset all progress?")) {
                  const deck = BASE_CONCEPTS.map((c) => ({
                    ...c,
                    box: 1,
                    nextDue: Date.now(),
                    seen: 0,
                    correct: 0,
                    learnedBox: 0,
                  }));
                  const s = { deck, xp: 0, streak: 0, lastActiveDate: todayStr(), badges: [] };
                  setState(s);
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Body with aside + main */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* ASIDE */}
          <aside className="w-56 shrink-0">
            <nav className="space-y-1">
              <NavItem label="Folders" active={dash === Dashboard.FOLDERS} onClick={() => setDash(Dashboard.FOLDERS)} />
              <NavItem label="Decks" active={dash === Dashboard.DECKS} onClick={() => setDash(Dashboard.DECKS)} />
              <NavItem label="Study" active={dash === Dashboard.STUDY} onClick={() => setDash(Dashboard.STUDY)} />
              <NavItem label="Exam" active={dash === Dashboard.EXAM} onClick={() => setDash(Dashboard.EXAM)} />
            </nav>
          </aside>

          {/* MAIN */}
          <main className="flex-1">
            {dash === Dashboard.STUDY && (
              <>
                <StudySelector
                  repo={repo}
                  activeIds={activeStudyDeckIds}
                  onChangeActiveIds={setActiveStudyDeckIds}
                  onLoadToStudy={applyStudySelectionFromRepo}
                  currentCount={state.deck.length}
                />

                <div className="mb-6">
                  <ProgressBar pct={overall.pct} label={`${overall.learnedPlus}/${overall.total} learned or higher`} />
                  <ProgressBar pct={progress.pct} label={`${progress.mastered}/${progress.total} mastered`} />
                  <BadgesRow earned={state.badges} />
                </div>

                <section>
                  <StudyView
                    deck={state.deck}
                    onStartNextGroup={() => {}}
                    onLearn={(id) => {
                      setState((s) => {
                        const deck = s.deck.map((c) =>
                          c.id === id
                            ? {
                                ...c,
                                learnedBox: Math.max(1, c.learnedBox ?? 0),
                                box: 2,
                                seen: c.seen + 1,
                                nextDue: Date.now() + DAY,
                              }
                            : c
                        );
                        return { ...s, deck, xp: s.xp + 2 };
                      });
                    }}
                    onQuiz={(id, correct) => {
                      setState((s) => {
                        const deck = s.deck.map((c) => {
                          if (c.id !== id) return c;
                          if (correct) {
                            return { ...c, box: 3, seen: c.seen + 1, correct: c.correct + 1 };
                          } else {
                            // deferred demotion at end of quiz run
                            return { ...c, box: 1, learnedBox: 0, seen: c.seen + 1 };
                          }
                        });
                        return { ...s, deck };
                      });
                    }}
                    onMaster={(id, correct) => {
                      setState((s) => {
                        const deck = s.deck.map((c) =>
                          c.id === id
                            ? {
                                ...c,
                                seen: c.seen + 1,
                                correct: c.correct + (correct ? 1 : 0),
                                mastered: correct ? true : c.mastered || false,
                                box: correct ? c.box : 2, // deferred demotion
                              }
                            : c
                        );
                        return { ...s, deck, xp: s.xp + (correct ? 8 : 2) };
                      });
                    }}
                  />
                </section>
              </>
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
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <ExamsView
                  folders={repo.folders}
                  decks={repo.decks}
                  onStartExam={(folderIds, deckIds) => {
                    alert(
                      `Exam starting with:\nFolders: ${folderIds.join(", ") || "(none)"}\nDecks: ${deckIds.join(", ") || "(none)"}`
                    );
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
