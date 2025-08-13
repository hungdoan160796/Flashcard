export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeQuestion(pool) {
  const idx = Math.floor(Math.random() * pool.length);
  const correct = pool[idx];
  const options = shuffle([
    correct.definition,
    ...shuffle(pool.filter((c, i) => i !== idx)).slice(0, 3).map((c) => c.definition),
  ]);
  return {
    id: correct.id,
    title: correct.title,
    correct: correct.definition,
    options,
  };
}