import React from "react";
import Papa from "papaparse";

/**
 * Add/Edit Deck view with CSV import
 * - Props
 *   - mode: "create" | "edit"
 *   - folders: [{id, name}]
 *   - initial: { name: string, folderId?: string, cards?: [{term,definition,use}] }
 *   - onCancel(): void
 *   - onSave(draft): void   // draft = { name, folderId, cards }
 */
export default function AddDeckView({ mode = "create", folders = [], initial, onCancel, onSave }) {
  const [name, setName] = React.useState(initial?.name || "");
  const [folderId, setFolderId] = React.useState(initial?.folderId || (folders[0]?.id ?? ""));
  const [rows, setRows] = React.useState(
    (initial?.cards || []).map(({ term = "", definition = "", use = "" }) => ({ term, definition, use }))
  );
  const [error, setError] = React.useState("");
  const [isParsing, setIsParsing] = React.useState(false);
  const fileRef = React.useRef(null);

  function parseCsv(file) {
    setError("");
    setIsParsing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (res) => {
        setIsParsing(false);

        const fields = res.meta?.fields || [];
        if (!fields.includes("term") || !fields.includes("definition")) {
          setError("CSV must include headers: term, definition, and use)");
          return;
        }

        const cleaned = [];
        const seen = new Set();

        for (const r of res.data || []) {
          const term = String(r.term ?? "").trim();
          const definition = String(r.definition ?? "").trim();
          const use = String(r.use ?? "").trim();
          if (!term || !definition) continue;
          // de-dupe by term inside this import
          if (seen.has(term)) continue;
          seen.add(term);
          cleaned.push({ term, definition, use });
        }

        if (!cleaned.length) {
          setError("No valid rows found in CSV.");
          return;
        }
        setRows(cleaned);
      },
      error: (err) => {
        setIsParsing(false);
        setError(err?.message || "Failed to parse CSV.");
      },
    });
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) parseCsv(file);
  }

  function addEmptyRow() {
    setRows((r) => [...r, { term: "", definition: "", use: "" }]);
  }

  function updateRow(idx, field, value) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  }

  function removeRow(idx) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  function handleSave() {
    setError("");
    if (!name.trim()) return setError("Please enter a deck name.");
    if (!rows.length) return setError("Add at least one card (CSV import or manual).");

    const draft = {
      name: name.trim(),
      folderId: folderId || null,
      cards: rows
        .map(({ term, definition, use }) => ({
          term: String(term || "").trim(),
          definition: String(definition || "").trim(),
          use: String(use || "").trim(),
        }))
        .filter((c) => c.term && c.definition),
    };
    if (!draft.cards.length) return setError("All rows are empty. Please add some cards.");

    onSave?.(draft);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {mode === "edit" ? "Edit deck" : "New deck"}
        </h3>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded border" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="px-3 py-1.5 rounded bg-emerald-600 text-white disabled:opacity-50"
            disabled={!name.trim() || isParsing}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-700 p-3">{error}</div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Deck name</span>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., IELTS - Food Vocabulary"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Folder</span>
          <select
            className="mt-1 w-full border rounded px-3 py-2"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col items-start gap-3">
          <label className="text-sm font-medium">CSV import</label>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} />
          {isParsing && <span className="text-xs text-slate-500">Parsing…</span>}
        </div>
        <p className="text-xs text-slate-600">
          Required headers: <code>term, definition, and use</code>.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Cards ({rows.length})</h4>
          <button className="px-2 py-1 text-sm rounded border" onClick={addEmptyRow}>
            + Add row
          </button>
        </div>

        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b w-12">#</th>
                <th className="text-left p-2 border-b">Term</th>
                <th className="text-left p-2 border-b">Definition</th>
                <th className="text-left p-2 border-b">Use</th>
                <th className="text-left p-2 border-b w-16"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">
                    No cards yet. Import a CSV or add rows manually.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50 align-top">
                    <td className="p-2 border-b">{i + 1}</td>
                    <td className="p-2 border-b">
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={r.term}
                        onChange={(e) => updateRow(i, "term", e.target.value)}
                        placeholder="apple"
                      />
                    </td>
                    <td className="p-2 border-b">
                      <textarea
                        className="w-full border rounded px-2 py-1"
                        rows={2}
                        value={r.definition}
                        onChange={(e) => updateRow(i, "definition", e.target.value)}
                        placeholder="A fruit"
                      />
                    </td>
                    <td className="p-2 border-b">
                      <textarea
                        className="w-full border rounded px-2 py-1"
                        rows={2}
                        value={r.use}
                        onChange={(e) => updateRow(i, "use", e.target.value)}
                        placeholder="I ate an apple for breakfast."
                      />
                    </td>
                    <td className="p-2 border-b">
                      <button className="text-xs px-2 py-1 rounded border" onClick={() => removeRow(i)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
