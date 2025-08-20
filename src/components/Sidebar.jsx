import React from "react";
import NavItem from "./ele/NavItem";
import XPBadge from "./ele/XPBadge";
import StreakBadge from "./ele/StreakBadge";
import { Dashboard } from "../constants/dashboards";
import StudySelector from "./StudySelector";
import "../styles/Sidebar.css";

export default function Sidebar({ title = "Flashcard", value, onChange, repo, activeIds, setActiveIds, onLoadFromRepo, deckCount, xp = 0, streak = 0, onReset, swipe }) {

  // derive arrays once so StudySelector can render a folder→decks tree
  const foldersArr = React.useMemo(() => Object.values(repo?.folders || {}), [repo]);
  const decksArr = React.useMemo(() => Object.values(repo?.decks || {}), [repo]);
  return (
    <aside
      className={`sb-drawer ${swipe == "swipeRight" ? "is-open" : ""}`}
      aria-hidden={!(swipe == "swipeRight")}
      role="navigation"
    >
      <div className={"flex flex-col gap-3 px-4 py-2"}>
        {/* Left: Title */}
        <h1 className={"text-2xl font-bold"}>
          {title}
        </h1>

        {/* Right: badges + reset */}
        <div className={"mt-2 flex flex-col gap-2"}>
          <XPBadge xp={xp} />
          <StreakBadge streak={streak} />
          <button
            className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
            onClick={onReset}
          >
            Reset Progress
          </button>
        </div>
      </div>
      <nav className="sb-nav">
        <NavItem label="Folders" active={value === Dashboard.FOLDERS} onClick={() => { onChange(Dashboard.FOLDERS); setOpen(false); }} />
        <NavItem label="Decks" active={value === Dashboard.DECKS} onClick={() => { onChange(Dashboard.DECKS); setOpen(false); }} />
        <NavItem label="Study" active={value === Dashboard.STUDY} onClick={() => { onChange(Dashboard.STUDY); setOpen(false); }} />
        <NavItem label="Exam" active={value === Dashboard.EXAM} onClick={() => { onChange(Dashboard.EXAM); setOpen(false); }} />
      </nav>
      <StudySelector
        folders={foldersArr}
        decks={decksArr}
        activeIds={activeIds}
        onChangeActiveIds={setActiveIds}
        onLoadToStudy={onLoadFromRepo}
        currentCount={deckCount}
      />
    </aside>
  );
}
