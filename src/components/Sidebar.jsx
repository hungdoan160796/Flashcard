import React from "react";
import NavItem from "./ele/NavItem";
import Header from "./Header";
import { Dashboard } from "../constants/dashboards";
import "../styles/Sidebar.css";

export default function Sidebar({ value, onChange, headerProps = {} }) {
  const [open, setOpen] = React.useState(false);
  const edgeRef = React.useRef(null);
  const touchRef = React.useRef({ startX: 0, startY: 0, tracking: false });

  const onMouseEnterEdge = () => setOpen(true);
  const onMouseLeaveSidebar = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
  };

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current.startX = t.clientX;
    touchRef.current.startY = t.clientY;
    touchRef.current.tracking = t.clientX <= 24 || open;
  };
  const onTouchMove = (e) => {
    if (!touchRef.current.tracking) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = Math.abs(t.clientY - touchRef.current.startY);
    if (dy > 30) return;
    if (!open && touchRef.current.startX <= 24 && dx > 40) {
      setOpen(true);
      touchRef.current.tracking = false;
    }
    if (open && dx < -40) {
      setOpen(false);
      touchRef.current.tracking = false;
    }
  };
  const onTouchEnd = () => { touchRef.current.tracking = false; };

  return (
    <>
      <div
        ref={edgeRef}
        className="sb-edge"
        onMouseEnter={onMouseEnterEdge}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {open && <div className="sb-backdrop" onClick={() => setOpen(false)} />}

      <aside
        className={`sb-drawer ${open ? "is-open" : ""}`}
        onMouseLeave={onMouseLeaveSidebar}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        aria-hidden={!open}
        role="navigation"
      >
        {/* ⬇️ Header embedded at the top of the drawer */}
        <Header variant="sidebar" showSummary={false} {...headerProps} />

        <nav className="sb-nav">
          <NavItem label="Folders" active={value === Dashboard.FOLDERS} onClick={() => { onChange(Dashboard.FOLDERS); setOpen(false); }} />
          <NavItem label="Decks"   active={value === Dashboard.DECKS}   onClick={() => { onChange(Dashboard.DECKS);   setOpen(false); }} />
          <NavItem label="Study"   active={value === Dashboard.STUDY}   onClick={() => { onChange(Dashboard.STUDY);   setOpen(false); }} />
          <NavItem label="Exam"    active={value === Dashboard.EXAM}    onClick={() => { onChange(Dashboard.EXAM);    setOpen(false); }} />
        </nav>
      </aside>
    </>
  );
}
