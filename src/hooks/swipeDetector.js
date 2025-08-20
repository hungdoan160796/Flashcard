import * as React from "react";

/**
 * Detect left/right swipes using Pointer Events (works for touch, mouse, pen).
 * Only triggers for touch input.
 */
export default function useSwipe({
  onLeft,
  onRight,
  minDistance = 50,        // px user must move horizontally
  verticalTolerance = 80,  // max vertical wiggle allowed
  maxDuration = 600        // ms to complete the swipe
} = {}) {
  const ref = React.useRef(null);
  const data = React.useRef({
    x: 0, y: 0, t: 0,
    intent: null,   // null | "horizontal" | "vertical"
    active: false,
    pointerId: null
  });

  const onPointerDown = (e) => {
    if (e.pointerType !== "touch") return; // ignore mouse
    data.current = {
      x: e.clientX,
      y: e.clientY,
      t: Date.now(),
      intent: null,
      active: true,
      pointerId: e.pointerId
    };
    // Capture moves on this element (nice to have)
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!data.current.active) return;
    const dx = e.clientX - data.current.x;
    const dy = e.clientY - data.current.y;

    // Decide gesture intent
    if (data.current.intent == null) {
      if (Math.abs(dx) > minDistance / 2 && Math.abs(dy) < verticalTolerance) {
        data.current.intent = "horizontal";
      } else if (Math.abs(dy) > verticalTolerance) {
        data.current.intent = "vertical";
      }
    }

    // Once we’ve decided it's horizontal, prevent vertical scroll jitter
    if (data.current.intent === "horizontal") {
      e.preventDefault();
    }
  };

  const onPointerUp = (e) => {
    if (!data.current.active) return;
    const dt = Date.now() - data.current.t;
    const dx = e.clientX - data.current.x;
    const dy = e.clientY - data.current.y;
    const horizontal = Math.abs(dx) >= minDistance;
    const verticalOk = Math.abs(dy) <= verticalTolerance;
    const fastEnough = dt <= maxDuration;

    if (data.current.intent !== "vertical" && horizontal && verticalOk && fastEnough) {
      if (dx < 0) onLeft?.(); else onRight?.();
    }

    data.current.active = false;
    data.current.intent = null;
    if (data.current.pointerId != null) {
      e.currentTarget.releasePointerCapture?.(data.current.pointerId);
    }
  };

  const handlers = { onPointerDown, onPointerMove, onPointerUp };
  return { ref, handlers };
}
