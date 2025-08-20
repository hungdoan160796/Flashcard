import React from "react";
import useSwipe from "../../hooks/swipeDetector";

// ---- Context so any nested component can read the swipe value ----
const SwipeContext = React.createContext({ swipe: null, setSwipe: () => {} });
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
    <SwipeContext.Provider value={{ swipe, setSwipe }}>
      <div
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
      </div>
    </SwipeContext.Provider>
  );
}
