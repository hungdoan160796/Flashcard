// src/hooks/useActiveStudyDecks.js
import React from "react";

const LS_STUDY_DECKS = "study_active_decks_v1";

export default function useActiveStudyDecks() {
  const [ids, setIds] = React.useState(() => {
    try {
      const raw = localStorage.getItem(LS_STUDY_DECKS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    localStorage.setItem(LS_STUDY_DECKS, JSON.stringify(ids));
  }, [ids]);

  return [ids, setIds];
}
