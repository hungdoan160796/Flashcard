import React from "react";

export default function MasterPanel({
  options,
  picked,
  correctKeys,
  showFeedback,
  onTogglePick,
  onSubmit,
  onNextAfterWrong,
  footer,
}) {
  const displayOptions = options;

  return (
    <aside className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 md:sticky md:top-4 pb-4">
      <ul className="mb-4 grid grid-cols-2 gap-2">
        {displayOptions.map((opt) => {
          const isPicked = picked.has(opt.key);
          const isCorrect = correctKeys.has(opt.key);
          const base =
            "w-full text-left rounded-lg border px-3 py-3 min-h-[44px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600";
          const cls =
            showFeedback && isPicked && !isCorrect
              ? `${base} bg-red-50 border-red-300 text-red-800 h-full`
              : isPicked
              ? `${base} bg-emerald-50 border-emerald-300 h-full`
              : `${base} bg-white hover:bg-slate-50 h-full`;

          return (
            <li key={opt.key}>
              <button
                type="button"
                className={cls}
                onClick={() => !showFeedback && onTogglePick(opt.key)}
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
          <button className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 w-full" onClick={onNextAfterWrong}>
            Next card
          </button>
        ) : (
          <button
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white w-full"
            onClick={onSubmit}
            disabled={picked.size === 0}
          >
            Submit
          </button>
        )}
      </div>

      {footer}
    </aside>
  );
}
