import React from "react";

export default function TopCard({
  phaseLabel,
  title,
  definition,
  context,
  showQuizReveal,          // ← used again
  showQuizForgotBanner,
  showMasterWrongBanner,
  progressPct,
  meta,
}) {
  const phase = String(phaseLabel || "").toLowerCase();
  const isLearn = phase === "learn";
  const isQuiz  = phase === "quiz";

  // Show details in LEARN, or in QUIZ after the user has revealed
  const shouldShowDetails = isLearn || (isQuiz && !!showQuizReveal);

  return (
    <section className="md:col-span-3 relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 h-fit">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-emerald-50 motion-safe:transition-[height] motion-safe:duration-300"
        style={{ height: `${Math.round(progressPct * 100)}%` }}
      />
      <div className="relative">
        {(showQuizForgotBanner || showMasterWrongBanner) && (
          <div
            role="status"
            aria-live="polite"
            className={
              "mb-3 rounded-lg px-3 py-2 text-sm border " +
              (showQuizForgotBanner
                ? "bg-amber-50 text-amber-900 border-amber-200"
                : "bg-red-50 text-red-800 border-red-200")
            }
          >
            {showQuizForgotBanner
              ? "You marked “I forgot”. This card will be moved to LEARN after this quiz run."
              : "Wrong answer. This card will be moved to QUIZ after this master run."}
          </div>
        )}

        <div className="text-xs text-slate-500 mb-2">Phase: {phaseLabel}</div>
        <h3 className="font-semibold text-lg sm:text-xl md:text-2xl">{title}</h3>

        {shouldShowDetails && (
          <>
            {definition && (
              <p className="mt-3 text-sm sm:text-base leading-relaxed max-w-prose">
                <span className="font-semibold">Definition: </span>
                {definition}
              </p>
            )}
            {context && (
              <p className="mt-3 text-sm sm:text-base leading-relaxed max-w-prose">
                <span className="font-semibold">Context: </span>
                {context}
              </p>
            )}
          </>
        )}

        <div className="mt-4 text-xs text-slate-500">{meta}</div>
      </div>
    </section>
  );
}
