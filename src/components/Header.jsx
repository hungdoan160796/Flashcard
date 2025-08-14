import React from "react";
import XPBadge from "./ele/XPBadge";
import StreakBadge from "./ele/StreakBadge";
import ProgressSummary from "./ele/ProgressSummary";

export default function Header({
  title = "Flashcard",
  xp = 0,
  streak = 0,
  onReset,
  overallPct,
  overallText,
  masteredPct,
  masteredText,
  badges = [],
  variant = "app",          // "app" | "sidebar"
  showSummary,              // optional override; defaults by variant
}) {
  const isSidebar = variant === "sidebar";
  const Wrapper = isSidebar ? "div" : "header";
  const summaryEnabled = showSummary ?? !isSidebar;

  return (
    <Wrapper
      className={
        isSidebar
          ? "border-b border-slate-200 p-3"
          : "sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200"
      }
    >
      <div
        className={
          isSidebar
            ? "px-3 py-3 flex flex-col"
            : "max-w-8xl mx-auto px-4 py-3 flex items-center justify-between"
        }
      >
        <h1 className={isSidebar ? "text-lg font-bold" : "text-xl sm:text-2xl font-bold pl-4"}>
          {title}
        </h1>

        {summaryEnabled && (
          <ProgressSummary
            overallPct={overallPct}
            overallText={overallText}
            masteredPct={masteredPct}
            masteredText={masteredText}
            earnedBadges={badges}
          />
        )}

        <div className={isSidebar ? "mt-2 flex flex-col gap-2" : "md:flex items-center gap-3 hidden"}>
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
    </Wrapper>
  );
}
