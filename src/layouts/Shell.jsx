export default function Shell({ headerRight, sidebar, children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold">Flashcard</h1>
          {headerRight}
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {sidebar}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
