// src/hooks/useAppGlobals.js
import React from "react";
import { Dashboard } from "../constants/dashboards.js";

import useRepo from "./useRepo";
import useActiveStudyDecks from "./useActiveStudyDecks";
import useStudyRuntime from "./useStudyRuntime";

import { isMastered, masteryProgress } from "../utils/leitner";
import { deckSignature, pickGroup } from "../utils/group";
import { buildMasterQuestion as _buildMasterQuestion } from "../utils/questions";

// PHASE enum (shared with UI)
export const PHASE = { LEARN: "learn", QUIZ: "quiz", MASTER: "master", DONE: "done" };

/** Safe wrapper so we never call the builder with a null card */
function buildMasterQuestionSafe(card, group) {
  if (!card) return { options: [], multi: false, correctKeys: new Set() };
  const { options = [], multi = false, correctKeys = new Set() } =
    _buildMasterQuestion(card, group) || {};
  // Normalize correctKeys to Set
  const ck = correctKeys instanceof Set ? correctKeys : new Set(correctKeys ?? []);
  return { options, multi, correctKeys: ck };
}

// Extracted controller for Learn/Quiz/Master runtime
export function useStudyController({ deck = [], onLearn, onQuiz, onMaster, onStartNextGroup }) {
  const deckSig = React.useMemo(() => deckSignature(deck || []), [deck]);

  // place ref BEFORE any effects that read/write it
  const startTotalsRef = React.useRef({ learn: 0, quiz: 0, master: 0 });

  // -------- group selection ----------
  const initialGroupIds = React.useMemo(
    () => new Set((pickGroup(deck || [], { size: 5 }) || []).map((c) => c.id)),
    [deckSig]
  );
  const [groupIds, setGroupIds] = React.useState(initialGroupIds);

  // quiz/master run state (declared early so effects can reset them)
  const [quizRunIds, setQuizRunIds] = React.useState([]);
  const [quizProcessed, setQuizProcessed] = React.useState(new Set());
  const [quizForgotIds, setQuizForgotIds] = React.useState(new Set());
  const [quizReveal, setQuizReveal] = React.useState(false);
  const quizRevealTimerRef = React.useRef(null);

  const [masterRunIds, setMasterRunIds] = React.useState([]);
  const [masterProcessed, setMasterProcessed] = React.useState(new Set());
  const [masterPendingDemote, setMasterPendingDemote] = React.useState(new Set());
  const [masterFeedback, setMasterFeedback] = React.useState(null); // { cardId, options, correctKeys }

  // reset when deck changes signature
  React.useEffect(() => {
    setGroupIds(new Set((pickGroup(deck || [], { size: 5 }) || []).map((c) => c.id)));
    startTotalsRef.current = { learn: 0, quiz: 0, master: 0 };

    // reset quiz/master snapshots
    setQuizRunIds([]); setQuizProcessed(new Set()); setQuizForgotIds(new Set()); setQuizReveal(false);
    setMasterRunIds([]); setMasterProcessed(new Set()); setMasterPendingDemote(new Set()); setMasterFeedback(null);
    setI(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckSig]);

  const group = React.useMemo(() => (deck || []).filter((c) => groupIds.has(c.id)), [deck, groupIds]);

  // auto-pick a new group when current group empties
  React.useEffect(() => {
    if (group.length === 0) {
      const anyUnmastered = (deck || []).some((c) => !isMastered(c));
      if (anyUnmastered) {
        const pickedIds = (pickGroup(deck || [], { size: 5 }) || []).map((c) => c.id);
        if (pickedIds.length > 0) setGroupIds(new Set(pickedIds));
      }
    }
  }, [group.length, deckSig]);

  // -------- live queues ----------
  const learnQ  = React.useMemo(() => group.filter((c) => c.box === 1 && ((c.learnedBox ?? 0) < 1)), [group]);
  const quizQ   = React.useMemo(() => group.filter((c) => c.box === 2), [group]);
  const masterQ = React.useMemo(() => group.filter((c) => c.box === 3 && !c.mastered), [group]);

  const phase =
    learnQ.length ? PHASE.LEARN :
    quizQ.length  ? PHASE.QUIZ  :
    masterQ.length? PHASE.MASTER: (group.length ? PHASE.DONE : PHASE.LEARN);

  // -------- quiz run (snapshot) ----------
  React.useEffect(() => {
    if (phase === PHASE.QUIZ && quizRunIds.length === 0 && quizQ.length > 0) {
      const ids = quizQ.map((c) => c.id);
      setQuizRunIds(ids);
      setQuizProcessed(new Set());
      setQuizForgotIds(new Set());
      startTotalsRef.current.quiz = ids.length;
      setI(0);
    }
    if (phase !== PHASE.QUIZ && quizRunIds.length) {
      setQuizRunIds([]); setQuizProcessed(new Set()); setQuizForgotIds(new Set()); setQuizReveal(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, quizQ.length]);

  const quizQueue = React.useMemo(() => {
    if (phase !== PHASE.QUIZ || quizRunIds.length === 0) return [];
    const remaining = quizRunIds.filter((id) => !quizProcessed.has(id));
    return remaining.map((id) => group.find((c) => c.id === id)).filter(Boolean);
  }, [phase, quizRunIds, quizProcessed, group]);

  // -------- master run (snapshot) ----------
  React.useEffect(() => {
    if (phase === PHASE.MASTER && masterRunIds.length === 0 && masterQ.length > 0) {
      const ids = masterQ.map((c) => c.id);
      setMasterRunIds(ids);
      setMasterProcessed(new Set());
      setMasterPendingDemote(new Set());
      startTotalsRef.current.master = ids.length;
      setI(0);
    }
    if (phase !== PHASE.MASTER && masterRunIds.length) {
      setMasterRunIds([]); setMasterProcessed(new Set()); setMasterPendingDemote(new Set()); setMasterFeedback(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, masterQ.length]);

  const masterQueue = React.useMemo(() => {
    if (phase !== PHASE.MASTER || masterRunIds.length === 0) return [];
    const remaining = masterRunIds.filter((id) => !masterProcessed.has(id));
    return remaining.map((id) => group.find((c) => c.id === id)).filter(Boolean);
  }, [phase, masterRunIds, masterProcessed, group]);

  // -------- active queue/card ----------
  const queue  = phase === PHASE.LEARN ? learnQ : phase === PHASE.QUIZ ? quizQueue : phase === PHASE.MASTER ? masterQueue : [];
  const [i, setI] = React.useState(0);
  const card  = queue[i] ?? null;

  const progress = card ? masteryProgress(card) : 0;
  React.useEffect(() => { if (!masterFeedback && i >= queue.length && queue.length > 0) setI(0); }, [queue.length, i, masterFeedback]);

  // -------- stable counters & position ----------
  React.useEffect(() => {
    if (phase === PHASE.LEARN && startTotalsRef.current.learn === 0)
      startTotalsRef.current.learn = learnQ.length || startTotalsRef.current.learn;
    if (phase === PHASE.DONE) startTotalsRef.current = { learn: 0, quiz: 0, master: 0 };
  }, [phase, learnQ.length, deckSig]);

  const startTotal =
    phase === PHASE.LEARN ? (startTotalsRef.current.learn || learnQ.length) :
    phase === PHASE.QUIZ  ? (startTotalsRef.current.quiz  || quizRunIds.length  || quizQ.length) :
    phase === PHASE.MASTER? (startTotalsRef.current.master|| masterRunIds.length|| masterQ.length) : 0;

  const processedCount =
    phase === PHASE.QUIZ   ? quizProcessed.size :
    phase === PHASE.MASTER ? masterProcessed.size :
    Math.max(0, startTotal - queue.length);

  const currentPos = Math.min(startTotal || 0, (processedCount || 0) + 1);

  // -------- actions ----------
  const onMarkLearned = () => { if (card) onLearn?.(card.id); };

  const answerQuiz = (knewIt) => {
    if (!card) return;
    if (knewIt) {
      setQuizProcessed((prev) => new Set(prev).add(card.id));
      onQuiz?.(card.id, true);
      setI(0);
    } else {
      setQuizReveal(true);
      setQuizForgotIds((prev) => new Set(prev).add(card.id));
      // clear previous timer if any
      if (quizRevealTimerRef.current) clearTimeout(quizRevealTimerRef.current);
      quizRevealTimerRef.current = setTimeout(() => {
        setQuizProcessed((prev) => new Set(prev).add(card.id));
        setQuizReveal(false);
        setI(0);
        quizRevealTimerRef.current = null;
      }, 2000);
    }
  };

  // cleanup on unmount
  React.useEffect(() => () => {
    if (quizRevealTimerRef.current) clearTimeout(quizRevealTimerRef.current);
  }, []);

  React.useEffect(() => {
    if (phase !== PHASE.QUIZ || quizRunIds.length === 0) return;
    const remaining = quizRunIds.filter((id) => !quizProcessed.has(id));
    if (remaining.length === 0) {
      const ids = Array.from(quizForgotIds);
      if (ids.length) ids.forEach((id) => onQuiz?.(id, false));
      setQuizRunIds([]); setQuizProcessed(new Set()); setQuizForgotIds(new Set()); setI(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, quizRunIds, quizProcessed, quizForgotIds]);

  const { options, multi, correctKeys } = React.useMemo(
    () => buildMasterQuestionSafe(card, group),
    [card?.id, group]
  );

  const [picked, setPicked] = React.useState(new Set());
  React.useEffect(() => { setPicked(new Set()); }, [card?.id, phase]);

  const onTogglePick = (k) => setPicked((prev) => {
    const n = new Set(prev);
    if (n.has(k)) n.delete(k);
    else { if (!multi) n.clear(); n.add(k); }
    return n;
  });

  const onSubmitMaster = () => {
    if (!card) return;
    const correct = picked.size === correctKeys.size && [...picked].every((k) => correctKeys.has(k));
    if (correct) {
      onMaster?.(card.id, true);
      setMasterProcessed((prev) => new Set(prev).add(card.id));
      setPicked(new Set());
      setI(0);
      return;
    }
    setMasterPendingDemote((prev) => new Set(prev).add(card.id));
    setMasterFeedback({ cardId: card.id, options, correctKeys: new Set(correctKeys) });
  };

  const onNextAfterWrong = () => {
    const id = masterFeedback?.cardId;
    if (id) setMasterProcessed((prev) => new Set(prev).add(id));
    setMasterFeedback(null);
    setPicked(new Set());
    setI(0);
  };

  React.useEffect(() => {
    if (phase !== PHASE.MASTER || masterRunIds.length === 0) return;
    const remaining = masterRunIds.filter((id) => !masterProcessed.has(id));
    if (remaining.length === 0) {
      const ids = Array.from(masterPendingDemote);
      if (ids.length) ids.forEach((id) => onMaster?.(id, false)); // demote to Box2
      setMasterRunIds([]); setMasterProcessed(new Set()); setMasterPendingDemote(new Set()); setMasterFeedback(null); setI(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, masterRunIds, masterProcessed, masterPendingDemote]);

  // -------- UI states for empty/done ----------
  const anyUnmastered = React.useMemo(() => (deck || []).some((c) => !isMastered(c)), [deckSig]);

  let emptyState = null; // 'noSelection' | 'loadingNext' | 'allMastered' | 'phaseEmpty' | null
  if ((deck || []).length === 0) emptyState = "noSelection";
  else if (group.length === 0 && anyUnmastered) emptyState = "loadingNext";
  else if (group.length === 0 && !anyUnmastered) emptyState = "allMastered";
  else if (!card && phase !== PHASE.DONE) emptyState = "phaseEmpty";

  const showQuizForgotBanner  = phase === PHASE.QUIZ   && quizReveal;
  const showMasterWrongBanner = phase === PHASE.MASTER && masterFeedback && masterFeedback.cardId === card?.id;

  // feedback overrides
  const uiOptions     = showMasterWrongBanner ? (masterFeedback?.options ?? options)      : options;
  const uiCorrectKeys = showMasterWrongBanner ? (masterFeedback?.correctKeys ?? correctKeys) : correctKeys;
  const showFeedback  = Boolean(showMasterWrongBanner);

  const startNextGroup = () => {
    onStartNextGroup?.();
    const next = (pickGroup((deck || []).filter((c) => !groupIds.has(c.id)), { size: 5 }) || []).map((c) => c.id);
    setGroupIds(new Set(next.length ? next : []));
  };

  return {
    // phase & card
    phase,
    card,
    progress,

    // banners & question
    showQuizReveal: quizReveal,
    showQuizForgotBanner,
    showMasterWrongBanner,

    options: uiOptions,
    correctKeys: uiCorrectKeys,
    showFeedback,
    picked,

    // actions for UI
    onMarkLearned,
    onQuizForgot: () => answerQuiz(false),
    onQuizKnew:   () => answerQuiz(true),
    quizDisabled: quizReveal,

    onTogglePick,
    onSubmitMaster,
    onNextAfterWrong,

    // counters shown in footer
    counters: { startTotal, currentPos },

    // empty/done states
    emptyState,
    isDone: phase === PHASE.DONE,
    doneGroupCount: group.length,
    onStartNextGroup: startNextGroup,
  };
}

export default function useAppGlobals() {
  // which dashboard is active
  const [dash, setDash] = React.useState(
    () => localStorage.getItem("dash_last_v1") || Dashboard.STUDY
  );
  React.useEffect(() => { localStorage.setItem("dash_last_v1", dash); }, [dash]);

  // repo (folders/decks) + CRUD
  const {
    repo, foldersArr, decksArr,
    addFolder, renameFolder, deleteFolder, moveDeck,
    createDeck, updateDeck, deleteDeck,
  } = useRepo();

  // study runtime
  const {
    xp, streak, badges, deck, deckCount,
    overallPctLearned, overallLearnedText,
    progressPctMastered, progressMasteredText,
    onLearn, onQuiz, onMaster, resetAll, loadRepoDecksIntoStudy,
  } = useStudyRuntime();

  // which repo deck IDs are active for Study
  const [activeStudyDeckIds, setActiveStudyDeckIds] = useActiveStudyDecks();

  // Normalize ids to array of strings for consumers
  const safeActiveIds = React.useMemo(
    () => Array.from(activeStudyDeckIds ?? []).map(String),
    [activeStudyDeckIds]
  );

  // Load selected decks into study
  const onLoadFromRepo = React.useCallback(
    (ids) => {
      const base = ids ?? activeStudyDeckIds ?? [];
      const typed = Array.from(base).map(String);
      if (!repo) return; // guard if repo not ready
      loadRepoDecksIntoStudy(repo, typed);
    },
    [activeStudyDeckIds, loadRepoDecksIntoStudy, repo]
  );

  // deck editor modal state (used on Decks dashboard)
  const [deckEditor, setDeckEditor] = React.useState(null);

  // study controller
  const study = useStudyController({ deck: deck || [], onLearn, onQuiz, onMaster });

  // StudySelector adapters
  const onChangeHeaderActiveIds = React.useCallback(
    (next) => setActiveStudyDeckIds(new Set(next ?? [])),
    [setActiveStudyDeckIds]
  );
  const onLoadToStudy = React.useCallback(
    (ids) => onLoadFromRepo(ids),
    [onLoadFromRepo]
  );

  // Header bundle (UI-only)
  const header = {
    title: "Flashcard",

    // nav
    value: dash,
    onChange: setDash,

    // stats
    xp: xp ?? 0,
    streak: streak ?? 0,
    badges: badges ?? [],

    // progress
    overallPct: overallPctLearned ?? 0,
    overallText: overallLearnedText ?? "",
    masteredPct: progressPctMastered ?? 0,
    masteredText: progressMasteredText ?? "",

    // selector (arrays)
    folders: foldersArr ?? [],
    decks: decksArr ?? [],
    activeIds: safeActiveIds,             // array of strings
    onChangeActiveIds: onChangeHeaderActiveIds,
    onLoadToStudy,
    deckCount: deckCount ?? 0,

    // actions
    onReset: resetAll,
  };

  return {
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
    resetAll, onLoadFromRepo,

    // active study selection
    activeStudyDeckIds, setActiveStudyDeckIds, safeActiveIds,

    // decks editor
    deckEditor, setDeckEditor,

    // study UI state/actions
    study,

    // header props
    header,
  };
}
