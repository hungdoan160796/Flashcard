import React from "react";
import { isMastered, masteryProgress } from "../utils/leitner";
import { deckSignature, pickGroup } from "../utils/group";
import { buildMasterQuestion } from "../utils/questions";

import TopCard from "../components/study/TopCard";
import LearnPanel from "../components/study/LearnPanel";
import QuizPanel from "../components/study/QuizPanel";
import MasterPanel from "../components/study/MasterPanel";

const PHASE = { LEARN: "learn", QUIZ: "quiz", MASTER: "master", DONE: "done" };

export default function StudyView({ deck = [], onLearn, onQuiz, onMaster, onStartNextGroup }) {
  const deckSig = React.useMemo(() => deckSignature(deck), [deck]);

  // -------- group selection ----------
  const [groupIds, setGroupIds] = React.useState(() => new Set(pickGroup(deck, { size: 5 }).map((c) => c.id)));
  React.useEffect(() => {
    setGroupIds(new Set(pickGroup(deck, { size: 5 }).map((c) => c.id)));
    startTotalsRef.current = { learn: 0, quiz: 0, master: 0 };
    setQuizRunIds([]); setQuizProcessed(new Set()); setQuizForgotIds(new Set()); setQuizReveal(false);
    setMasterRunIds([]); setMasterProcessed(new Set()); setMasterPendingDemote(new Set()); setMasterFeedback(null);
    setI(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckSig]);

  const group = React.useMemo(() => deck.filter((c) => groupIds.has(c.id)), [deck, groupIds]);

  // -------- live queues ----------
  const learnQ = React.useMemo(() => group.filter((c) => c.box === 1 && ((c.learnedBox ?? 0) < 1)), [group]);
  const quizQ  = React.useMemo(() => group.filter((c) => c.box === 2), [group]);
  const masterQ= React.useMemo(() => group.filter((c) => c.box === 3 && !c.mastered), [group]);

  const phase =
    learnQ.length ? PHASE.LEARN :
    quizQ.length  ? PHASE.QUIZ  :
    masterQ.length? PHASE.MASTER:
    (group.length ? PHASE.DONE : PHASE.LEARN);

  // -------- quiz run (snapshot) ----------
  const [quizRunIds, setQuizRunIds] = React.useState([]);
  const [quizProcessed, setQuizProcessed] = React.useState(new Set());
  const [quizForgotIds, setQuizForgotIds] = React.useState(new Set());
  const [quizReveal, setQuizReveal] = React.useState(false);

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
  const [masterRunIds, setMasterRunIds] = React.useState([]);
  const [masterProcessed, setMasterProcessed] = React.useState(new Set());
  const [masterPendingDemote, setMasterPendingDemote] = React.useState(new Set());
  const [masterFeedback, setMasterFeedback] = React.useState(null); // { cardId, options, correctKeys }

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
  const queue = phase === PHASE.LEARN ? learnQ : phase === PHASE.QUIZ ? quizQueue : phase === PHASE.MASTER ? masterQueue : [];
  const [i, setI] = React.useState(0);
  const card = queue[i] ?? null;

  const p = card ? masteryProgress(card) : 0;
  React.useEffect(() => { if (!masterFeedback && i >= queue.length && queue.length > 0) setI(0); }, [queue.length, i, masterFeedback]);

  // -------- stable counters & position ----------
  const startTotalsRef = React.useRef({ learn: 0, quiz: 0, master: 0 });
  React.useEffect(() => {
    if (phase === PHASE.LEARN && startTotalsRef.current.learn === 0)
      startTotalsRef.current.learn = learnQ.length || startTotalsRef.current.learn;
    if (phase === PHASE.DONE) startTotalsRef.current = { learn: 0, quiz: 0, master: 0 };
  }, [phase, learnQ.length, deckSig]);

  const startTotal =
    phase === PHASE.LEARN ? (startTotalsRef.current.learn || learnQ.length) :
    phase === PHASE.QUIZ  ? (startTotalsRef.current.quiz  || quizRunIds.length || quizQ.length) :
    phase === PHASE.MASTER? (startTotalsRef.current.master|| masterRunIds.length || masterQ.length) : 0;

  const processedCount =
    phase === PHASE.QUIZ ? quizProcessed.size :
    phase === PHASE.MASTER ? masterProcessed.size :
    Math.max(0, startTotal - queue.length);

  const currentPos = Math.min(startTotal, processedCount + 1);

  // -------- actions ----------
  const markLearned = () => { if (card) onLearn(card.id); };
  const answerQuiz = (knewIt) => {
    if (!card) return;
    if (knewIt) {
      setQuizProcessed((prev) => new Set(prev).add(card.id));
      onQuiz(card.id, true);
      setI(0);
    } else {
      setQuizReveal(true);
      setQuizForgotIds((prev) => new Set(prev).add(card.id));
      setTimeout(() => {
        setQuizProcessed((prev) => new Set(prev).add(card.id));
        setQuizReveal(false);
        setI(0);
      }, 2000);
    }
  };

  React.useEffect(() => {
    if (phase !== PHASE.QUIZ || quizRunIds.length === 0) return;
    const remaining = quizRunIds.filter((id) => !quizProcessed.has(id));
    if (remaining.length === 0) {
      const ids = Array.from(quizForgotIds);
      if (ids.length) ids.forEach((id) => onQuiz(id, false));
      setQuizRunIds([]); setQuizProcessed(new Set()); setQuizForgotIds(new Set()); setI(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, quizRunIds, quizProcessed, quizForgotIds]);

  const { options, multi, correctKeys } = React.useMemo(() => buildMasterQuestion(card, group), [card?.id, group]);
  const [picked, setPicked] = React.useState(new Set());
  React.useEffect(() => { setPicked(new Set()); }, [card?.id, phase]);

  const togglePick = (k) => setPicked((prev) => {
    const n = new Set(prev);
    if (n.has(k)) n.delete(k);
    else { if (!multi) n.clear(); n.add(k); }
    return n;
  });

  const submitMaster = () => {
    if (!card) return;
    const correct = picked.size === correctKeys.size && [...picked].every((k) => correctKeys.has(k));
    if (correct) {
      onMaster(card.id, true);
      setMasterProcessed((prev) => new Set(prev).add(card.id));
      setPicked(new Set());
      setI(0);
      return;
    }
    setMasterPendingDemote((prev) => new Set(prev).add(card.id));
    setMasterFeedback({ cardId: card.id, options, correctKeys: new Set(correctKeys) });
  };

  const nextAfterWrong = () => {
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
      if (ids.length) ids.forEach((id) => onMaster(id, false)); // demote to Box2
      setMasterRunIds([]); setMasterProcessed(new Set()); setMasterPendingDemote(new Set()); setMasterFeedback(null); setI(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, masterRunIds, masterProcessed, masterPendingDemote]);

  // -------- empty/done states ----------
  if (group.length === 0) {
    const anyUnmastered = deck.some((c) => !isMastered(c));
    if (anyUnmastered) {
      const pickedIds = pickGroup(deck, { size: 5 }).map((c) => c.id);
      if (pickedIds.length > 0) { setGroupIds(new Set(pickedIds)); return null; }
    }
    return <div className="rounded-2xl border border-slate-200 p-5 text-slate-500">All cards are mastered. 🎉</div>;
  }

  if (phase === PHASE.DONE) {
    return (
      <div className="rounded-2xl border border-slate-200 p-5 bg-white">
        <div className="text-lg font-semibold mb-2">Concept group complete 🎉</div>
        <div className="text-slate-600 mb-4">All {group.length} cards are mastered. Start another group when ready.</div>
        <button
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => {
            onStartNextGroup?.();
            const next = pickGroup(deck.filter((c) => !groupIds.has(c.id)), { size: 5 }).map((c) => c.id);
            setGroupIds(new Set(next.length ? next : []));
          }}
        >
          Start next group
        </button>
      </div>
    );
  }

  if (!card) {
    return <div className="rounded-2xl border border-slate-200 p-5 text-slate-400 italic">No more cards in this phase.</div>;
  }

  const showQuizForgotBanner = phase === PHASE.QUIZ && quizReveal;
  const showMasterWrongBanner = phase === PHASE.MASTER && masterFeedback && masterFeedback.cardId === card.id;

  const footer = (
    <div className="text-xs sm:text-sm text-slate-500 mt-4">
      Card {Math.max(1, currentPos)} of {startTotal}
    </div>
  );

  return (
    <div className="max-w-screen-lg mx-auto h-fit">
      <div className="flex flex-col justify-center gap-4 md:gap-6">
        <TopCard
          phaseLabel={phase.toUpperCase()}
          title={card.title}
          definition={phase !== PHASE.QUIZ ? card.definition : quizReveal ? card.definition : undefined}
          context={phase !== PHASE.QUIZ ? card.context : quizReveal ? card.context : undefined}
          showQuizReveal={phase === PHASE.QUIZ && quizReveal}
          showQuizForgotBanner={showQuizForgotBanner}
          showMasterWrongBanner={showMasterWrongBanner}
          progressPct={p}
          meta={`Box ${card.box} • Seen ${card.seen} • Correct ${card.correct} • ${Math.round(p * 100)}%`}
        />

        {phase === PHASE.LEARN && (
          <LearnPanel onMarkLearned={markLearned} footer={footer} />
        )}

        {phase === PHASE.QUIZ && (
          <QuizPanel
            onForgot={() => answerQuiz(false)}
            onKnewIt={() => answerQuiz(true)}
            disabled={quizReveal}
            footer={footer}
          />
        )}

        {phase === PHASE.MASTER && (
          <MasterPanel
            options={masterFeedback && masterFeedback.cardId === card.id ? masterFeedback.options : options}
            correctKeys={masterFeedback && masterFeedback.cardId === card.id ? masterFeedback.correctKeys : correctKeys}
            picked={picked}
            showFeedback={Boolean(masterFeedback && masterFeedback.cardId === card.id)}
            onTogglePick={togglePick}
            onSubmit={submitMaster}
            onNextAfterWrong={nextAfterWrong}
            footer={footer}
          />
        )}
      </div>
    </div>
  );
}
