import React from "react";
import ConceptCard from "../components/ConceptCard";
import { now } from "../utils/leitner";

export default function ReviewView({ deck, onAnswer }) {
  const due = deck.filter((d) => d.nextDue <= now()).sort((a, b) => a.nextDue - b.nextDue);
  const [idx, setIdx] = React.useState(0);
  const [showAnswer, setShowAnswer] = React.useState(false);

  if (!due.length)
    return <div className="text-center text-lg">No cards due for review!</div>;

  const card = due[idx];

  function handle(correct) {
    onAnswer(card.id, correct);
    setShowAnswer(false);
    if (idx + 1 < due.length) setIdx((i) => i + 1);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <ConceptCard card={card} showAnswer={showAnswer} />
      {!showAnswer ? (
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white"
          onClick={() => setShowAnswer(true)}
        >
          Show Answer
        </button>
      ) : (
        <div className="flex gap-4">
          <button
            className="px-4 py-2 rounded bg-green-600 text-white"
            onClick={() => handle(true)}
          >
            I was Correct
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white"
            onClick={() => handle(false)}
          >
            I was Wrong
          </button>
        </div>
      )}
      <div className="text-sm text-slate-500">
        Card {idx + 1} of {due.length} due
      </div>
    </div>
  );
}