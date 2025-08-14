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

// Keep any existing exports; add/replace with the following helpers:

export function buildMasterQuestion(card, group) {
  if (!card) return { options: [], multi: false, correctKeys: new Set() };

  const answers = group.flatMap((c) => {
    const out = [];
    if (c.definition) out.push({ key: `def-${c.id}`, text: c.definition, kind: "Definition", conceptId: c.id });
    if (c.context) out.push({ key: `ctx-${c.id}`, text: c.context,    kind: "Context",    conceptId: c.id });
    return out;
  });

  const correctPool = answers.filter((a) => a.conceptId === card.id);
  const hasBoth =
    correctPool.some((a) => a.key.startsWith("def-")) &&
    correctPool.some((a) => a.key.startsWith("ctx-"));

  const wantTwo = hasBoth && Math.random() < 0.5;
  const correctOptions = (() => {
    if (wantTwo) {
      const def = correctPool.find((a) => a.key.startsWith("def-"));
      const ctx = correctPool.find((a) => a.key.startsWith("ctx-"));
      return [def, ctx].filter(Boolean).slice(0, 2);
    }
    if (hasBoth) {
      const pickDef = Math.random() < 0.5;
      return [
        pickDef
          ? correctPool.find((a) => a.key.startsWith("def-"))
          : correctPool.find((a) => a.key.startsWith("ctx-")),
      ].filter(Boolean);
    }
    return [correctPool[0]].filter(Boolean);
  })();

  const needDistractors = Math.max(0, 6 - correctOptions.length);
  const distractorPool = answers.filter((a) => a.conceptId !== card.id);
  const distractors = shuffle(distractorPool).slice(0, needDistractors);
  const options = shuffle([...correctOptions, ...distractors]);

  const correctKeys = new Set(correctOptions.map((o) => o.key));
  const multi = correctKeys.size > 1;

  if (options.length < 6) {
    const remaining = answers.filter((a) => !options.some((o) => o.key === a.key));
    options.push(...remaining.slice(0, 6 - options.length));
  }

  return { options, multi, correctKeys };
}

