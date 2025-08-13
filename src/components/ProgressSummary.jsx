import React from "react";
import ProgressBar from "./ProgressBar";
import BadgesRow from "./BadgesRow";

export default function ProgressSummary({ overallPct, overallText, masteredPct, masteredText, earnedBadges }) {
  return (
    <div className="mb-6">
      <ProgressBar pct={overallPct}  label={overallText} />
      <ProgressBar pct={masteredPct} label={masteredText} />
      <BadgesRow earned={earnedBadges} />
    </div>
  );
}
