import type { Variants } from "motion/react";

export const STAGGER_DELAY = 0.09;
export const REVEAL_DURATION = 0.55;
export const REVEAL_DISTANCE = 18;
export const REVEAL_FROM_OPACITY = 0;
export const REVEAL_TO_OPACITY = 1;
const REVEAL_EASE = [0.22, 1, 0.36, 1] as const;

export const staggerParentVariants: Variants = {
  hidden: {},
  visible: {},
};

export const revealVariants: Variants = {
  hidden: { opacity: REVEAL_FROM_OPACITY, y: REVEAL_DISTANCE },
  visible: (index: number) => ({
    opacity: REVEAL_TO_OPACITY,
    y: 0,
    transition: {
      duration: REVEAL_DURATION,
      delay: index * STAGGER_DELAY,
      ease: REVEAL_EASE,
    },
  }),
};
