import React from "react";
import XPBadge from "./ele/XPBadge";
import StreakBadge from "./ele/StreakBadge";
import ProgressSummary from "./ele/ProgressSummary";
import NavItem from "./ele/NavItem";
import StudySelector from "./StudySelector";
import { Dashboard } from "../constants/dashboards";

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
  // NEW: wire dashboard + study props so Header can fully replace Sidebar on desktop
  value,                 // Dashboard active value
  onChange,              // Dashboard tab change
  repo,                  // { folders, decks } object maps
  activeIds,             // selected deck ids (Set or array)
  setActiveIds,          // setter for selected ids
  onLoadFromRepo,        // function to load selected decks into study
  deckCount,             // current count in study
  variant = "app",
  showSummary,           // optional override; defaults by variant
}) {
  const isSidebar = variant === "sidebar";
  const Wrapper = isSidebar ? "div" : "header";
  const summaryEnabled = showSummary ?? !isSidebar;

  // Build arrays for StudySelector (same as Sidebar.jsx)
  const foldersArr = React.useMemo(() => Object.values(repo?.folders || {}), [repo]);
  const decksArr = React.useMemo(() => Object.values(repo?.decks || {}), [repo]);
  const selectedIds = React.useMemo(
    () => Array.from(activeIds ?? []),
    [activeIds]
  );
  // Popover state for StudySelector
  const [selOpen, setSelOpen] = React.useState(false);
  const popRef = React.useRef(null);

  // Close on outside click / ESC
  React.useEffect(() => {
    if (!selOpen) return;
    const onDocClick = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setSelOpen(false);
    };
    const onEsc = (e) => { if (e.key === "Escape") setSelOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [selOpen]);

  // When user applies selection to study, also close the popover
  const handleLoadToStudy = React.useCallback((ids) => {
    onLoadFromRepo?.(ids);
    setSelOpen(false);
  }, [onLoadFromRepo]);

  return (
    <Wrapper
      className={
        isSidebar
          ? "border-b border-slate-200"
          : "sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200"
      }
    >
      <div
        className={
          isSidebar
            ? "px-4 py-2 flex flex-col"
            : "max-w-8xl mx-auto px-4 py-2"
        }
      >
        {/* Top row */}
        <div className={isSidebar ? "flex flex-col gap-3" : "flex items-center"}>
          {/* Left: Title */}
          <h1 className={isSidebar ? "text-2xl font-bold" : "text-2xl font-bold sm:pr-12"}>
            {title}
          </h1>

          {/* Center: Nav (desktop only) */}
          {!isSidebar && (
            <nav className="hidden md:flex items-center gap-1">
              <NavItem label="Folders" active={value === Dashboard.FOLDERS} onClick={() => onChange?.(Dashboard.FOLDERS)} />
              <NavItem label="Decks" active={value === Dashboard.DECKS} onClick={() => onChange?.(Dashboard.DECKS)} />
              <NavItem label="Study" active={value === Dashboard.STUDY} onClick={() => onChange?.(Dashboard.STUDY)} />
              <NavItem label="Exam" active={value === Dashboard.EXAM} onClick={() => onChange?.(Dashboard.EXAM)} />
            </nav>
          )}

          {/* Progress summary under the row (desktop) */}
          {summaryEnabled && (
            <div className={isSidebar ? "mt-2" : "mt-2 flex-1 flex items-center justify-end gap-3"}>
              <ProgressSummary
                overallPct={overallPct}
                overallText={overallText}
                masteredPct={masteredPct}
                masteredText={masteredText}
                earnedBadges={badges}
              />
            </div>
          )}

          {/* Right: badges + reset + selector trigger (desktop) */}
          <div className={isSidebar ? "mt-2 flex flex-col gap-2" : "hidden md:flex items-center gap-3"}>
            <XPBadge xp={xp} />
            <StreakBadge streak={streak} />
            <button
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
              onClick={onReset}
            >
              Reset Progress
            </button>
            {/* StudySelector trigger */}
            <div className={isSidebar ? "hidden" : "relative"}>
              <StudySelector
                folders={foldersArr}
                decks={decksArr}
                activeIds={selectedIds}
                onChangeActiveIds={(next) => setActiveIds?.(Array.from(next ?? []))}
                onLoadToStudy={handleLoadToStudy}
                currentCount={deckCount}
              />
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
