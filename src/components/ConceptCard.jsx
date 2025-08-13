export default function ConceptCard({ card }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-lg">{card.title}</h3>
      <p className="mt-2 text-sm"><span className="font-medium">Definition:</span> {card.definition}</p>
      <p className="mt-2 text-sm"><span className="font-medium">Example:</span> {card.example}</p>
      <p className="mt-2 text-sm text-slate-600"><span className="font-medium">Context:</span> {card.context}</p>
    </div>
  );
}
