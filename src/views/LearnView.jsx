import React from "react";
import { isMastered, masteryProgress } from "../utils/leitner.js";
function deckSignature(deck) {
  // Using ids ensures a new signature when you load a new selection
  // (since you generate new ids when loading from repo)
  return deck.length + ":" + deck.map(c => c.id).join(",");
}

function pickGroup(deck, { exclude = new Set(), size = 5 } = {}) {
  // Priority buckets (excluding already in a previous group and already mastered)
  const A = deck.filter(c =>
    !exclude.has(c.id) && c.box === 1 && ((c.learnedBox ?? 0) < 1) && !isMastered(c)
  );
  const B = deck.filter(c =>
    !exclude.has(c.id) && c.box === 2 && !isMastered(c)
  );
  const C = deck.filter(c =>
    !exclude.has(c.id) && c.box === 3 && !isMastered(c)
  );

  // Stable sort (by id) for predictability
  const byId = (a, b) => String(a.id).localeCompare(String(b.id));

  const out = [];
  for (const bucket of [A.sort(byId), B.sort(byId), C.sort(byId)]) {
    for (const c of bucket) {
      if (out.length >= size) break;
      out.push(c);
    }
    if (out.length >= size) break;
  }
  return out; // can be < size if not enough unmastered cards exist
}


const PHASE = { LEARN: "learn", QUIZ: "quiz", MASTER: "master", DONE: "done" };

export default function StudyView({ deck = [], onLearn, onQuiz, onMaster, onStartNextGroup }) {
  const deckSig = React.useMemo(() => deckSignature(deck), [deck]);
  // ---------- Build/hold a concept group (first 5 from Box 1 that still need learn) ----------
  const [groupIds, setGroupIds] = React.useState(() => {// initial pick: prefer Box1 then top-up from 2→3 (if you already have pickGroup)
    const picked = (typeof pickGroup === "function"
      ? pickGroup(deck, { size: 5 })
      : deck
        .filter(c => c.box === 1 && ((c.learnedBox ?? 0) < 1) && !isMastered(c))
        .sort((a, b) => String(a.id).localeCompare(String(b.id)))
        .slice(0, 5)
    ).map(c => c.id);
    return new Set(picked);
  });

    // When the loaded study deck changes, reset group & per-run counters
  React.useEffect(() => {
    // rebuild the starting group for the new deck
    const picked = (typeof pickGroup === "function"
      ? pickGroup(deck, { size: 5 })
      : deck
          .filter(c => c.box === 1 && ((c.learnedBox ?? 0) < 1) && !isMastered(c))
          .sort((a, b) => String(a.id).localeCompare(String(b.id)))
          .slice(0, 5)
    ).map(c => c.id);
    setGroupIds(new Set(picked));

    // reset all per-run helpers and stable counters
    startTotalsRef.current = { learn: 0, quiz: 0, master: 0 };
    setQuizRunIds([]); setQuizProcessed(new Set()); setQuizForgotIds(new Set()); setQuizReveal(false);
    setMasterRunIds([]); setMasterProcessed(new Set()); setMasterPendingDemote(new Set()); setMasterFeedback(null);
    setI(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckSig]); // ← fires when you load a different selection
  const group = React.useMemo(() => deck.filter(c => groupIds.has(c.id)), [deck, groupIds]);

  // ---------- Phase queues (live) ----------
  const learnQ = React.useMemo(() => group.filter(c => c.box === 1 && ((c.learnedBox ?? 0) < 1)), [group]);
  const quizQ = React.useMemo(() => group.filter(c => c.box === 2), [group]);
  const masterQ = React.useMemo(() => group.filter(c => c.box === 3 && !c.mastered), [group]);


  // (you probably already have a group progress calc like groupPct)

  // Decide phase by availability
  const phase = learnQ.length
    ? PHASE.LEARN
    : quizQ.length
      ? PHASE.QUIZ
      : masterQ.length
        ? PHASE.MASTER
        : (group.length ? PHASE.DONE : PHASE.LEARN);

  // ---------- Snapshot runs for QUIZ and MASTER (so demotions are deferred) ----------
  // QUIZ run state
  const [quizRunIds, setQuizRunIds] = React.useState([]);
  const [quizProcessed, setQuizProcessed] = React.useState(new Set());
  const [quizForgotIds, setQuizForgotIds] = React.useState(new Set()); // to apply demotion at end
  const [quizReveal, setQuizReveal] = React.useState(false); // show def/ctx for 2s after "I forgot"

  React.useEffect(() => {
    if (phase === PHASE.QUIZ && quizRunIds.length === 0 && quizQ.length > 0) {
      const ids = quizQ.map(c => c.id);
      setQuizRunIds(ids);
      setQuizProcessed(new Set());
      setQuizForgotIds(new Set());
      startTotalsRef.current.quiz = ids.length; // stable counter for this run
      setI(0);
    }
    // reset helpers when leaving QUIZ
    if (phase !== PHASE.QUIZ && quizRunIds.length) {
      setQuizRunIds([]);
      setQuizProcessed(new Set());
      setQuizForgotIds(new Set());
      setQuizReveal(false);
    }
  }, [phase, quizQ.length]); // eslint-disable-line

  const quizQueue = React.useMemo(() => {
    if (phase !== PHASE.QUIZ || quizRunIds.length === 0) return [];
    const remaining = quizRunIds.filter(id => !quizProcessed.has(id));
    return remaining.map(id => group.find(c => c.id === id)).filter(Boolean);
  }, [phase, quizRunIds, quizProcessed, group]);

  // MASTER run state
  const [masterRunIds, setMasterRunIds] = React.useState([]);
  const [masterProcessed, setMasterProcessed] = React.useState(new Set());
  const [masterPendingDemote, setMasterPendingDemote] = React.useState(new Set());
  const [masterFeedback, setMasterFeedback] = React.useState(null); // { cardId, options, correctKeys }

  React.useEffect(() => {
    if (phase === PHASE.MASTER && masterRunIds.length === 0 && masterQ.length > 0) {
      const ids = masterQ.map(c => c.id);
      setMasterRunIds(ids);
      setMasterProcessed(new Set());
      setMasterPendingDemote(new Set());
      startTotalsRef.current.master = ids.length; // stable counter for this run
      setI(0);
    }
    // reset helpers when leaving MASTER
    if (phase !== PHASE.MASTER && masterRunIds.length) {
      setMasterRunIds([]);
      setMasterProcessed(new Set());
      setMasterPendingDemote(new Set());
      setMasterFeedback(null);
    }
  }, [phase, masterQ.length]); // eslint-disable-line

  const masterQueue = React.useMemo(() => {
    if (phase !== PHASE.MASTER || masterRunIds.length === 0) return [];
    const remaining = masterRunIds.filter(id => !masterProcessed.has(id));
    return remaining.map(id => group.find(c => c.id === id)).filter(Boolean);
  }, [phase, masterRunIds, masterProcessed, group]);

  // ---------- Which queue is active right now? ----------
  const queue = phase === PHASE.LEARN ? learnQ
    : phase === PHASE.QUIZ ? quizQueue
      : phase === PHASE.MASTER ? masterQueue
        : [];

  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (masterFeedback) return; // don’t jump while showing master feedback
    if (i >= queue.length && queue.length > 0) setI(0);
  }, [queue.length, i, masterFeedback]);

  // ---------- Active card & progress ----------
  const card = queue[i] ?? null;
  const p = card ? masteryProgress(card) : 0;

  // ---------- Stable counters ----------
  const startTotalsRef = React.useRef({ learn: 0, quiz: 0, master: 0 });
  React.useEffect(() => {
    if (phase === PHASE.LEARN && startTotalsRef.current.learn === 0)
      startTotalsRef.current.learn = learnQ.length || startTotalsRef.current.learn;
    if (phase === PHASE.DONE)
      startTotalsRef.current = { learn: 0, quiz: 0, master: 0 };
  }, [phase, learnQ.length, deckSig]);

  // per-phase totals & “Card X of Y”
  const startTotal =
    phase === PHASE.LEARN ? (startTotalsRef.current.learn || learnQ.length) :
      phase === PHASE.QUIZ ? (startTotalsRef.current.quiz || quizRunIds.length || quizQ.length) :
        phase === PHASE.MASTER ? (startTotalsRef.current.master || masterRunIds.length || masterQ.length) : 0;

  const processedCount =
    phase === PHASE.QUIZ ? quizProcessed.size :
      phase === PHASE.MASTER ? masterProcessed.size :
        Math.max(0, startTotal - queue.length);

  const currentPos = Math.min(startTotal, processedCount + 1);

  // ---------- Actions ----------
  // LEARN: no pause
  const markLearned = () => {
    if (!card) return;
    onLearn(card.id); // parent should: learnedBox=1, box=2, seen++, xp
    // keep index; next slides in
  };

  // QUIZ:
  // - I knew it: immediate promote to Box 3, processed right away
  // - I forgot: show banner + reveal def/ctx for 2s, then mark processed; demotion deferred to end
  const answerQuiz = (knewIt) => {
    if (!card) return;
    if (knewIt) {
      setQuizProcessed(prev => {
        const n = new Set(prev); n.add(card.id); return n;
      });
      onQuiz(card.id, true); // promote now
      setI(0);
    } else {
      setQuizReveal(true);
      setQuizForgotIds(prev => { const n = new Set(prev); n.add(card.id); return n; });
      // wait 2s showing the reveal, then mark processed and advance
      setTimeout(() => {
        setQuizProcessed(prev => {
          const n = new Set(prev); n.add(card.id); return n;
        });
        setQuizReveal(false);
        setI(0);
      }, 2000);
    }
  };

  // When a QUIZ run finishes, apply all deferred demotions to Box 1, then phase logic will naturally go back to LEARN if any.
  React.useEffect(() => {
    if (phase !== PHASE.QUIZ || quizRunIds.length === 0) return;
    const remaining = quizRunIds.filter(id => !quizProcessed.has(id));
    if (remaining.length === 0) {
      const ids = Array.from(quizForgotIds);
      if (ids.length) ids.forEach(id => onQuiz(id, false)); // parent should demote to Box 1
      // reset run; phase will recompute on next render
      setQuizRunIds([]);
      setQuizProcessed(new Set());
      setQuizForgotIds(new Set());
      setI(0);
    }
  }, [phase, quizRunIds, quizProcessed, quizForgotIds]); // eslint-disable-line

  // MASTER (6 options, sometimes multi-select)
  const { options, multi, correctKeys } = React.useMemo(
    () => buildMasterQuestion(card, group),
    [card?.id, group]
  );
  const [picked, setPicked] = React.useState(new Set());
  React.useEffect(() => { setPicked(new Set()); }, [card?.id, phase]);

  const togglePick = (k) => {
    setPicked(prev => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else { if (!multi) n.clear(); n.add(k); }
      return n;
    });
  };

  const submitMaster = () => {
    if (!card) return;
    const correct =
      picked.size === correctKeys.size &&
      [...picked].every(k => correctKeys.has(k));

    if (correct) {
      onMaster(card.id, true); // master now
      setMasterProcessed(prev => { const n = new Set(prev); n.add(card.id); return n; });
      setPicked(new Set());
      setI(0);
      return;
    }

    // WRONG → show feedback, defer demotion to end of master run
    setMasterPendingDemote(prev => { const n = new Set(prev); n.add(card.id); return n; });
    setMasterFeedback({
      cardId: card.id,
      options,
      correctKeys: new Set(correctKeys),
    });
  };

  const nextAfterWrong = () => {
    const id = masterFeedback?.cardId;
    if (id) {
      setMasterProcessed(prev => { const n = new Set(prev); n.add(id); return n; });
    }
    setMasterFeedback(null);
    setPicked(new Set());
    setI(0);
  };

  // When a MASTER run finishes, apply deferred demotions to Box 2, then phase will naturally go back to QUIZ.
  React.useEffect(() => {
    if (phase !== PHASE.MASTER || masterRunIds.length === 0) return;
    const remaining = masterRunIds.filter(id => !masterProcessed.has(id));
    if (remaining.length === 0) {
      const ids = Array.from(masterPendingDemote);
      if (ids.length) ids.forEach(id => onMaster(id, false)); // parent should demote to Box 2
      setMasterRunIds([]);
      setMasterProcessed(new Set());
      setMasterPendingDemote(new Set());
      setMasterFeedback(null);
      setI(0);
    }
  }, [phase, masterRunIds, masterProcessed, masterPendingDemote]); // eslint-disable-line

  // ---------- Empty / done states ----------
  if (group.length === 0) {
    const anyUnmastered = deck.some(c => !isMastered(c));
    if (anyUnmastered) {
      // There are unmastered cards but not enough to form 5 under the strict rules → pick whatever is left
      const picked = pickGroup(deck, { size: 5 }).map(c => c.id);
      if (picked.length > 0) {
        setGroupIds(new Set(picked));
        return null; // let render continue next tick with the new group
      }
    }
    // Truly nothing left to learn
    return (
      <div className="rounded-2xl border border-slate-200 p-5 text-slate-500">
        All cards are mastered. 🎉
      </div>
    );
  }


  if (phase === PHASE.DONE) {
    return (
      <div className="rounded-2xl border border-slate-200 p-5 bg-white">
        <div className="text-lg font-semibold mb-2">Concept group complete 🎉</div>
        <div className="text-slate-600 mb-4">
          All {group.length} cards are mastered. Start another group when ready.
        </div>
        <button
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => {
            onStartNextGroup?.();
            const next = pickGroup(
              deck.filter(c => !groupIds.has(c.id)), // avoid immediately repeating the same cards
              { size: 5 }
            ).map(c => c.id);

            // If there are still some unmastered cards but fewer than 5, we accept the smaller group.
            if (next.length > 0) {
              setGroupIds(new Set(next));
            } else {
              // Nothing left except mastered → surface the “All mastered” UI on next render
              setGroupIds(new Set());
            }
          }}
        >
          Start next group
        </button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="rounded-2xl border border-slate-200 p-5 text-slate-400 italic">
        No more cards in this phase.
      </div>
    );
  }

  // ---------- UI ----------
  const showQuizForgotBanner = (phase === PHASE.QUIZ && quizReveal);
  const showMasterWrongBanner = (phase === PHASE.MASTER && masterFeedback && masterFeedback.cardId === card.id);

  return (
    <div className="grid grid-rows-1 gap-6">
      {/* Left: active card with emerald fill */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5" style={{ height: "fit-content" }}>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-emerald-50" style={{ height: `${Math.round(p * 100)}%` }} />
        <div className="relative">
          {(showQuizForgotBanner || showMasterWrongBanner) && (
            <div className={
              "mb-3 rounded-lg px-3 py-2 text-sm border " +
              (showQuizForgotBanner ? "bg-amber-50 text-amber-900 border-amber-200"
                : "bg-red-50 text-red-800 border-red-200")
            }>
              {showQuizForgotBanner
                ? "You marked “I forgot”. This card will be moved to LEARN after this quiz run."
                : "Wrong answer. This card will be moved to QUIZ after this master run."}
            </div>
          )}

          <div className="text-xs text-slate-500 mb-2">Phase: {phase.toUpperCase()}</div>
          <h3 className="font-semibold text-xl">{card.title}</h3>

          {/* Definitions/Context visibility:
              - LEARN & MASTER: always visible
              - QUIZ: visible only during the 2s reveal after “I forgot”
          */}
          {phase !== PHASE.QUIZ && card.definition && (
            <p className="mt-3"><span className="font-semibold">Definition: </span>{card.definition}</p>
          )}
          {phase !== PHASE.QUIZ && card.context && (
            <p className="mt-3"><span className="font-semibold">Context: </span>{card.context}</p>
          )}
          {phase === PHASE.QUIZ && quizReveal && (
            <>
              {card.definition && <p className="mt-3"><span className="font-semibold">Definition: </span>{card.definition}</p>}
              {card.context && <p className="mt-3"><span className="font-semibold">Context: </span>{card.context}</p>}
            </>
          )}

          <div className="mt-4 text-xs text-slate-500">
            Box {card.box} • Seen {card.seen} • Correct {card.correct} • {Math.round(p * 100)}%
          </div>
        </div>
      </section>

      {/* Right: phase panel */}
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 h-fit">
        {phase === PHASE.LEARN && (
          <>
            <h4 className="font-semibold mb-2">Learn</h4>
            <p className="text-sm text-slate-600 mb-4">Mark as learned to move this card into QUIZ.</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white" onClick={markLearned}>
                Mark learned
              </button>
            </div>
          </>
        )}

        {phase === PHASE.QUIZ && (
          <>
            <h4 className="font-semibold mb-2">Quick quiz</h4>
            <p className="text-sm text-slate-600 mb-4">We only show the concept here. Be honest with yourself 🙂</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg border bg-white hover:bg-slate-50" onClick={() => answerQuiz(false)} disabled={quizReveal}>
                I forgot
              </button>
              <button className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800" onClick={() => answerQuiz(true)} disabled={quizReveal}>
                I knew it
              </button>
            </div>
          </>
        )}

        {phase === PHASE.MASTER && (
          <>
            <h4 className="font-semibold mb-2">
              {masterFeedback ? "Review your answer" : (multi ? "Select ALL that apply" : "Pick the correct option")}
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              Mix of definitions and contexts. {masterFeedback ? "Incorrect; the card will be demoted after this run." : (multi ? "This one has multiple correct answers." : "Only one is correct.")}
            </p>

            {(() => {
              const showFeedback = Boolean(masterFeedback && masterFeedback.cardId === card.id);
              const displayOptions = showFeedback ? masterFeedback.options : options;
              const displayCorrectKs = showFeedback ? masterFeedback.correctKeys : correctKeys;

              return (
                <>
                  <ul className="mb-4 grid grid-cols-2 gap-6">
                    {displayOptions.map((opt) => {
                      const isPicked = picked.has(opt.key);
                      const isCorrect = displayCorrectKs.has(opt.key);
                      const base = "w-full h-full text-left rounded-lg border px-3 py-2 transition";
                      const cls =
                        showFeedback && isPicked && !isCorrect
                          ? `${base} bg-red-50 border-red-300 text-red-800`
                          : isPicked
                            ? `${base} bg-emerald-50 border-emerald-300`
                            : `${base} bg-white hover:bg-slate-50`;

                      return (
                        <li key={opt.key}>
                          <button
                            type="button"
                            className={cls}
                            onClick={() => { if (!showFeedback) togglePick(opt.key); }}
                            disabled={showFeedback}
                          >
                            <span className="text-xs uppercase tracking-wide text-slate-500">{opt.kind}</span>
                            <div className="font-medium">{opt.text}</div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="flex gap-2">
                    {showFeedback ? (
                      <button className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800" onClick={nextAfterWrong}>
                        Next card
                      </button>
                    ) : (
                      <button
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={submitMaster}
                        disabled={picked.size === 0}
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </>
              );
            })()}

            <div className="text-xs text-slate-500 mt-4">
              Card {currentPos} of {startTotal}
            </div>
          </>
        )}

        {phase !== PHASE.MASTER && (
          <div className="text-xs text-slate-500 mt-4">
            Card {currentPos} of {startTotal}
          </div>
        )}
      </aside>
    </div>
  );
}



/** Build a 6-option master question from the current 5-card group. */
function buildMasterQuestion(card, group) {
  if (!card) return { options: [], multi: false, correctKeys: new Set() };

  const answers = group.flatMap((c) => {
    const out = [];
    if (c.definition) out.push({ key: `def-${c.id}`, text: c.definition, kind: "Definition", conceptId: c.id });
    if (c.context) out.push({ key: `ctx-${c.id}`, text: c.context, kind: "Context", conceptId: c.id });
    return out;
  });

  const correctPool = answers.filter(a => a.conceptId === card.id);
  const hasBoth = correctPool.some(a => a.key.startsWith("def-")) && correctPool.some(a => a.key.startsWith("ctx-"));

  const wantTwo = hasBoth && Math.random() < 0.5;
  const correctOptions = (() => {
    if (wantTwo) {
      const def = correctPool.find(a => a.key.startsWith("def-"));
      const ctx = correctPool.find(a => a.key.startsWith("ctx-"));
      return [def, ctx].filter(Boolean).slice(0, 2);
    }
    if (hasBoth) {
      const pickDef = Math.random() < 0.5;
      return [pickDef ? correctPool.find(a => a.key.startsWith("def-")) : correctPool.find(a => a.key.startsWith("ctx-"))].filter(Boolean);
    }
    return [correctPool[0]].filter(Boolean);
  })();

  const needDistractors = Math.max(0, 6 - correctOptions.length);
  const distractorPool = answers.filter(a => a.conceptId !== card.id);
  const distractors = shuffle(distractorPool).slice(0, needDistractors);
  const options = shuffle([...correctOptions, ...distractors]);

  const correctKeys = new Set(correctOptions.map(o => o.key));
  const multi = correctKeys.size > 1;

  if (options.length < 6) {
    const remaining = answers.filter(a => !options.some(o => o.key === a.key));
    options.push(...remaining.slice(0, 6 - options.length));
  }

  return { options, multi, correctKeys };
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
