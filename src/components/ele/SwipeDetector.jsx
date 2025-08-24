import React from "react";
import useSwipe from "../../hooks/swipeDetector";

// ---- Context so any nested component can read the swipe value ----
const SwipeContext = React.createContext({ swipe: null, setSwipe: () => { } });
export const useSwipeValue = () => React.useContext(SwipeContext);

/**
 * SwipeSnackDemo
 * - Detects left/right swipes on its main container
 * - Shows a snackbar message
 * - Provides { swipe } to children via Context
 * - If children is a function, calls it with { swipe } (render-prop)
 */
export default function SwipeSnackDemo({ children }) {
  const [swipe, setSwipe] = React.useState(null); // "swipeLeft" | "swipeRight" | null

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
    typeof children === "function" ? children({ swipe, setSwipe }) : children;

  return (
    <SwipeContext.Provider value={{ swipe, setSwipe }}>
      <div
        ref={ref}
        {...handlers}
        className="min-h-screen"
        style={{ touchAction: "pan-y" }} // keep vertical scroll smooth
      >
        {renderedChildren}
      </div>
    </SwipeContext.Provider>
  );
}
