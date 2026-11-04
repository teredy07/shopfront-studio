import type { Transition } from "motion/react";

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Quick, settled motion for UI that follows a click (pills, cards, slides). */
export const springSnappy = {
  type: "spring",
  stiffness: 520,
  damping: 42,
  mass: 0.9,
} as const satisfies Transition;
