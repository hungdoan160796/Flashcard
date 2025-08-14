import React from "react";

export default function LearnPanel({ onMarkLearned, footer }) {
  return (
    <aside className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 md:sticky md:top-4 pb-4">
      <div className="flex gap-2">
        <button
          className="w-full sm:w-auto px-4 py-3 min-h-[44px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 active:scale-[.99] transition [touch-action:manipulation]"
          onClick={onMarkLearned}
        >
          Mark learned
        </button>
      </div>
      {footer}
    </aside>
  );
}
