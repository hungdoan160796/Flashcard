import React from "react";

/**
 * RepoIO — Export / Import / Restore controls for your repo.
 *
 * Props:
 *  - repo: the current repo object
 *  - onReplace: (newRepo) => void    // replace current repo with imported one
 *
 * Optional nicety included: a "Restore backup" button that brings back the
 * last pre-import repo saved under localStorage key "repo_backup_v1".
 */
export default function RepoIO({ repo, onReplace }) {
  const BACKUP_KEY = "repo_backup_v1";

  function doExport() {
    const blob = new Blob([JSON.stringify(repo, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flash_repo_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        if (!json || typeof json !== "object" || !json.folders || !json.decks) {
          alert("Invalid repo file. Expecting an object with {folders, decks}.");
          return;
        }
        if (!confirm("Replace current repo with this file? This will overwrite your data.")) return;

        // backup current repo
        try {
          localStorage.setItem(BACKUP_KEY, JSON.stringify(repo));
        } catch {}

        // replace
        onReplace?.(json);
        alert("Import complete.");
      } catch {
        alert("Failed to parse the selected file.");
      }
    };
    reader.readAsText(file);
  }

  function doRestoreBackup() {
    try {
      const raw = localStorage.getItem(BACKUP_KEY);
      if (!raw) {
        alert("No backup found.");
        return;
      }
      const backup = JSON.parse(raw);
      if (!confirm("Restore the last backup? This will overwrite your current repo.")) return;
      onReplace?.(backup);
      alert("Backup restored.");
    } catch {
      alert("Failed to restore backup.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
        onClick={doExport}
      >
        Export
      </button>

      <label className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 cursor-pointer">
        Import
        <input
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
            e.target.value = ""; // allow re-selecting same file
          }}
        />
      </label>

      <button
        className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
        onClick={doRestoreBackup}
        title="Restore the last backup saved before an import"
      >
        Restore backup
      </button>
    </div>
  );
}
