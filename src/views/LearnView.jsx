// src/views/LearnView.jsx
import React from "react";
import { PHASE } from "../hooks/useAppGlobals";
import TopCard from "../components/study/TopCard";
import LearnPanel from "../components/study/LearnPanel";
import QuizPanel from "../components/study/QuizPanel";
import MasterPanel from "../components/study/MasterPanel";

export default function LearnView(props) {
  const {
    phase,
    card,
    progress,

    showQuizReveal,
    showQuizForgotBanner,
    showMasterWrongBanner,

    options,
    correctKeys,
    showFeedback,
    picked,

    onMarkLearned,
    onQuizForgot,
    onQuizKnew,
    quizDisabled,

    onTogglePick,
    onSubmitMaster,
    onNextAfterWrong,

    counters: { startTotal, currentPos },

    emptyState,          // 'noSelection' | 'loadingNext' | 'allMastered' | 'phaseEmpty' | null
    isDone,
    doneGroupCount,
    onStartNextGroup,
  } = props;

  // --- Empty/done UI states ---
  if (emptyState === "noSelection") {
    return <>
    <div className="hidden md:flex rounded-2xl border border-slate-200 p-5 text-slate-500 flex justify-center align-center">Click "Decks" to add deck first.</div>
    <div className="flex md:hidden rounded-2xl border border-slate-200 p-5 text-slate-500 flex justify-center align-center">Swipe right and click "Decks" to add a new deck.</div>
    </>;
  }
  if (emptyState === "loadingNext") {
    return <div className="rounded-2xl border border-slate-200 p-5 text-slate-500 flex justify-center align-center">Loading next group…</div>;
  }
  if (emptyState === "allMastered") {
    return <div className="rounded-2xl border border-slate-200 p-5 text-slate-500 flex justify-center align-center">All cards are mastered. 🎉</div>;
  }
  if (isDone) {
    return (
      <div className="rounded-2xl border border-slate-200 p-5 bg-white">
        <div className="text-lg font-semibold mb-2">Concept group complete 🎉</div>
        <div className="text-slate-600 mb-4">All {doneGroupCount} cards are mastered. Start another group when ready.</div>
        <button
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={onStartNextGroup}
        >
          Start next group
        </button>
      </div>
    );
  }
  if (emptyState === "phaseEmpty") {
    return <div className="rounded-2xl border border-slate-200 p-5 text-slate-400 italic">No more cards in this phase.</div>;
  }

  // Guard (shouldn't happen, but keeps UI safe)
  if (!card) {
    return <div className="rounded-2xl border border-slate-200 p-5 text-slate-400 italic">No card available.</div>;
  }

  const footer = (
    <div className="text-xs sm:text-sm text-slate-500 mt-4 w-full text-center">
      Card {Math.max(1, currentPos)} of {startTotal}
    </div>
  );

  const meta = `Box ${card.box} • Seen ${card.seen} • Correct ${card.correct} • ${Math.round(progress * 100)}%`;

  return (
    <div className="max-w-screen-lg mx-auto h-fit">
      <div className="flex flex-col justify-center gap-4 md:gap-6">
        <TopCard
          phaseLabel={phase.toUpperCase()}
          title={card.title}
          definition={phase === PHASE.LEARN ? card.definition : (phase === PHASE.QUIZ && showQuizReveal) ? card.definition : undefined}
          context={phase === PHASE.LEARN ? card.context : (phase === PHASE.QUIZ && showQuizReveal) ? card.context : undefined}
          showQuizReveal={phase === PHASE.QUIZ && showQuizReveal}
          showQuizForgotBanner={showQuizForgotBanner}
          showMasterWrongBanner={showMasterWrongBanner}
          progressPct={progress}
          meta={meta}
        />

        {phase === PHASE.LEARN && (
          <LearnPanel onMarkLearned={onMarkLearned} footer={footer} />
        )}

        {phase === PHASE.QUIZ && (
          <QuizPanel
            onForgot={onQuizForgot}
            onKnewIt={onQuizKnew}
            disabled={quizDisabled}
            footer={footer}
          />
        )}

        {phase === PHASE.MASTER && (
          <MasterPanel
            options={options}
            correctKeys={correctKeys}
            picked={picked}
            showFeedback={showFeedback}
            onTogglePick={onTogglePick}
            onSubmit={onSubmitMaster}
            onNextAfterWrong={onNextAfterWrong}
            footer={footer}
          />
        )}
      </div>
    </div>
  );
}
