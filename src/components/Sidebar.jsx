import React from "react";
import NavItem from "./NavItem";
import { Dashboard } from "../constants/dashboards";

export default function Sidebar({ value, onChange }) {
  return (
    <aside className="w-24 shrink-0">
      <nav className="space-y-1">
        <NavItem label="Folders" active={value === Dashboard.FOLDERS} onClick={() => onChange(Dashboard.FOLDERS)} />
        <NavItem label="Decks"   active={value === Dashboard.DECKS}   onClick={() => onChange(Dashboard.DECKS)} />
        <NavItem label="Study"   active={value === Dashboard.STUDY}   onClick={() => onChange(Dashboard.STUDY)} />
        <NavItem label="Exam"    active={value === Dashboard.EXAM}    onClick={() => onChange(Dashboard.EXAM)} />
      </nav>
    </aside>
  );
}
