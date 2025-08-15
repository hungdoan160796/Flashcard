import React from "react";
import StudyView from "../views/LearnView";

export default function StudyDashboard({deck, onLearn, onQuiz, onMaster,}) {
  return (
    <>
      <section>
        <StudyView deck={deck} onStartNextGroup={() => {}} onLearn={onLearn} onQuiz={onQuiz} onMaster={onMaster} />
      </section>
    </>
  );
}
