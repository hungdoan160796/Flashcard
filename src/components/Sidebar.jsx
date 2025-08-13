export default function Sidebar({ active, onSelect }) {
  return (
    <aside className="w-56 shrink-0">
      <nav className="space-y-1">
        {["Folders","Decks","Study","Exam"].map(label => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => onSelect(label)}
              className={
                "w-full text-left px-3 py-2 rounded-lg font-medium transition " +
                (isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100")
              }
            >
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
