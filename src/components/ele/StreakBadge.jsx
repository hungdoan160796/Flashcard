export default function StreakBadge({ streak }) {
  return (
    <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l1.9 5.7H20l-4.9 3.6 1.9 5.7L12 13l-5 4 2-6-5-3h6z" />
      </svg>
      <span>{streak} day streak</span>
    </div>
  );
}
