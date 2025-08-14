import React from "react";

export default function QuizPanel({ onForgot, onKnewIt, disabled, footer }) {
  return (
    <aside className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-3 md:sticky md:top-4 pb-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          className="w-full sm:w-auto px-4 py-3 min-h-[44px] rounded-lg border bg-white hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400 active:scale-[.99] transition [touch-action:manipulation]"
          onClick={onForgot}
          disabled={disabled}
        >
          I forgot
        </button>
        <button
          className="w-full sm:w-auto px-4 py-3 min-h-[44px] rounded-lg bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900 active:scale-[.99] transition [touch-action:manipulation]"
          onClick={onKnewIt}
          disabled={disabled}
        >
          I knew it
        </button>
      </div>
      {footer}
    </aside>
  );
}
