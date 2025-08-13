// src/components/DebugBox.jsx
export default function DebugBox({ title = "Debug", data }) {
  return (
    <details open className="rounded-2xl border border-slate-300 bg-white my-4">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
        {title}
      </summary>
      <pre className="px-3 pb-3 text-xs whitespace-pre-wrap overflow-auto max-h-96">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}
