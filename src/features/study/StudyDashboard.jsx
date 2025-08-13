import React from "react";
import StudySelector from "./StudySelector";
import StudyView from "../../views/LearnView";

export default function StudyDashboard({
  repo, activeIds, setActiveIds, deck,
  deckCount,
  onLoadFromRepo, onLearn, onQuiz, onMaster,
}) {
  return (
    <>
      <section>
        <StudyView deck={deck} onStartNextGroup={() => {}} onLearn={onLearn} onQuiz={onQuiz} onMaster={onMaster} />
      </section>
      <StudySelector
        repo={repo}
        activeIds={activeIds}
        onChangeActiveIds={setActiveIds}
        onLoadToStudy={onLoadFromRepo}
        currentCount={deckCount}
      />
    </>
  );
}
