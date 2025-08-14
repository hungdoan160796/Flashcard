export default function ProgressBar({ pct, label }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-600">Progress</span>
        <span className="text-slate-500">{label ?? `${pct}%`}</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
