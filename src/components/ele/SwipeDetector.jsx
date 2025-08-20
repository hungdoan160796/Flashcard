import React from "react";
import useSwipe from "../../hooks/swipeDetector";

// ---- Context so any nested component can read the swipe value ----
const SwipeContext = React.createContext({ swipe: null });
export const useSwipeValue = () => React.useContext(SwipeContext);

/**
 * SwipeSnackDemo
 * - Detects left/right swipes on its main container
 * - Shows a snackbar message
 * - Provides { swipe } to children via Context
 * - If children is a function, calls it with { swipe } (render-prop)
 */
export default function SwipeSnackDemo({ children }) {
  const [notice, setNotice] = React.useState(null);
  const [swipe, setSwipe] = React.useState(null); // "swipeLeft" | "swipeRight" | null
  const timeoutRef = React.useRef(null);

  const showNotice = (msg) => {
    setNotice(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setNotice(null), 1200);
  };

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const { ref, handlers } = useSwipe({
    onLeft: () => {
      setSwipe("swipeLeft");
    },
    onRight: () => {
      setSwipe("swipeRight");
    },
    minDistance: 45,
    verticalTolerance: 70,
    maxDuration: 500,
  });

  const renderedChildren =
    typeof children === "function" ? children({ swipe }) : children;

  return (
    <SwipeContext.Provider value={{ swipe }}>
      <main
        ref={ref}
        {...handlers}
        className="min-h-screen"
        style={{ touchAction: "pan-y" }} // keep vertical scroll smooth
      >
        {renderedChildren ?? (
          <div className="p-6 text-center opacity-80">
            <p className="text-lg">Swipe anywhere on this area.</p>
            <p className="mt-2 text-sm">Latest swipe: {swipe ?? "—"}</p>
          </div>
        )}

        {/* Snackbar */}
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl shadow-lg
                      bg-neutral-900 text-white text-sm transition-all
                      ${notice ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
        >
          {notice || ""}
        </div>
      </main>
    </SwipeContext.Provider>
  );
}
