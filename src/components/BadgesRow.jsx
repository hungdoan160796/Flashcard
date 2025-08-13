export default function BadgesRow({ earned }) {
  if (!earned?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {earned.map((id) => (
        <span key={id} className="text-[10px] px-2 py-1 rounded-full border bg-white border-slate-200">
          🏅 {id.replace(/-/g, " ")}
        </span>
      ))}
    </div>
  );
}
