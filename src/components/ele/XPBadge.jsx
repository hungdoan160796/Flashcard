export default function XPBadge({ xp }) {
  return (
    <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11l19-9-9 19-2-8-8-2z" />
      </svg>
      <span>{xp} XP</span>
    </div>
  );
}
