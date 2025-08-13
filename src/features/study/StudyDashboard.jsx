import React from "react";
import StudySelector from "./StudySelector";
import ProgressSummary from "../../components/ProgressSummary";
import StudyView from "../../views/LearnView";

export default function StudyDashboard({
  repo, activeIds, setActiveIds, deck,
  deckCount, overallPct, overallText, masteredPct, masteredText, badges,
  onLoadFromRepo, onLearn, onQuiz, onMaster,
}) {
  return (
    <>
      <StudySelector
        repo={repo}
        activeIds={activeIds}
        onChangeActiveIds={setActiveIds}
        onLoadToStudy={onLoadFromRepo}
        currentCount={deckCount}
      />
      <ProgressSummary
        overallPct={overallPct}
        overallText={overallText}
        masteredPct={masteredPct}
        masteredText={masteredText}
        earnedBadges={badges}
      />
      <section>
        <StudyView deck={deck} onStartNextGroup={() => {}} onLearn={onLearn} onQuiz={onQuiz} onMaster={onMaster} />
      </section>
    </>
  );
}
