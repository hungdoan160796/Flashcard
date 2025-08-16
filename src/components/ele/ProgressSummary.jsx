import React from "react";
import ProgressBar from "./ProgressBar";
import BadgesRow from "../BadgesRow";

export default function ProgressSummary({ overallPct, overallText, masteredPct, masteredText, earnedBadges }) {
  return (
    <div className="w-full pl-4 sm:px-4">
      <ProgressBar pct={overallPct}  label={overallText} />
    </div>
  );
}
