import React from "react";
import MultiSelectTree from "./ele/MultiSelectTree";

/** StudySelector
 * Props:
 * - folders: [{id, name}]
 * - decks: [{id, name, folderId|null, cards?: []}]
 * - activeIds: string[] (selected deck ids)
 * - onChangeActiveIds: (ids: string[]) => void
 * - onLoadToStudy?: (ids: string[]) => void
 * - currentCount?: number   // cards currently in Study (optional)
 */
export default function StudySelector({
  folders,
  decks,
  activeIds,
  onChangeActiveIds,
  onLoadToStudy,
  currentCount = 0,
}) {
  const handleApply = (ids) => {
  console.log("[StudySelector] apply ids:", ids);
    onChangeActiveIds(ids);
    onLoadToStudy?.(ids); // keep same behavior: Apply also loads
  };

  const totalSelectedCards = React.useMemo(
    () =>
      decks
        .filter(d => activeIds.map(String).includes(String(d.id)))
        .reduce((sum, d) => sum + (d.cards?.length ?? 0), 0),
    [decks, activeIds]
  );

  return (
    <div className="p-4 h-fit md:my-0 md:p-0 md:h-auto">
      <div className="flex flex-col gap-3">
        <label className="block flex-1">
          <div className="text-sm font-medium mb-1 md:hidden">Decks</div>
          <MultiSelectTree
            folders={folders}
            decks={decks}
            selectedIds={activeIds.map(String)}
            onApply={handleApply}
          />
        </label>
      </div>

      <div className="mt-2 text-xs text-slate-500 md:hidden">
        Tip: open the picker to choose by folder. {currentCount} cards currently in Study.
        {activeIds.length > 0 && <> ({totalSelectedCards} from selected decks)</>}
      </div>
    </div>
  );
}
