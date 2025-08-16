// src/components/NavItem.jsx
import React from "react";

export default function NavItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        "w-full text-left px-4 py-2 font-medium transition " +
        (active
          ? "bg-blue-600 text-white"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900")
      }
    >
      {label}
    </button>
  );
}
