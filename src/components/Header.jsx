import React from "react";
import XPBadge from "./XPBadge";
import StreakBadge from "./StreakBadge";

export default function Header({ title = "Flashcard", xp, streak, onReset }) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-3">
          <XPBadge xp={xp} />
          <StreakBadge streak={streak} />
          <button
            className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
