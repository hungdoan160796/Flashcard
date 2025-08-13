import React from "react";
import { getDeckArray } from "./utils";

export default function StudySelector({ repo, activeIds, onChangeActiveIds, onLoadToStudy, currentCount }) {
  const decks = getDeckArray(repo);
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <label className="block flex-1">
          <div className="text-sm font-medium mb-1">Choose decks for Study</div>
          <select
            multiple
            size={Math.min(8, decks.length || 4)}
            className="w-full border rounded px-2 py-2"
            value={activeIds}
            onChange={(e) => {
              const ids = Array.from(e.target.selectedOptions).map(o => o.value);
              onChangeActiveIds(ids);
            }}
          >
            {decks.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.cards?.length ?? 0})</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded border" onClick={() => onChangeActiveIds([])}>Clear</button>
          <button className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
                  disabled={activeIds.length === 0} onClick={onLoadToStudy}>
            Load to Study
          </button>
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Tip: multi-select with Ctrl/Cmd or Shift. Current study has {currentCount} cards.
      </div>
    </div>
  );
}
