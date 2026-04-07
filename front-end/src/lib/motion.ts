import type { Transition, Variants } from "framer-motion";

export const editorialEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
export type RevealStrategy = "in-view" | "mount";

export const editorialDurations = {
  fast: 0.18,
  base: 0.28,
  slow: 0.42,
} as const;

export const editorialTransition: Transition = {
  duration: editorialDurations.base,
  ease: editorialEase,
};

export const editorialViewport = {
  once: true,
  amount: 0.16,
} as const;

export function buildRevealVariants(
  reduceMotion: boolean,
  options?: {
    y?: number;
    delay?: number;
    duration?: number;
  }
): Variants {
  const y = options?.y ?? 18;
  const delay = options?.delay ?? 0;
  const duration = options?.duration ?? editorialDurations.slow;

  return {
    hidden: {
      opacity: 0,
      y: reduceMotion ? 0 : y,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduceMotion
        ? { duration: 0.01 }
        : {
            duration,
            delay,
            ease: editorialEase,
          },
    },
  };
}

export function buildStaggerVariants(
  reduceMotion: boolean,
  options?: {
    stagger?: number;
    delayChildren?: number;
  }
): Variants {
  const stagger = options?.stagger ?? 0.05;
  const delayChildren = options?.delayChildren ?? 0.04;

  return {
    hidden: {},
    visible: {
      transition: reduceMotion
        ? { duration: 0.01 }
        : {
            staggerChildren: stagger,
            delayChildren,
          },
    },
  };
}

export function buildHoverLift(reduceMotion: boolean, y = -3) {
  if (reduceMotion) {
    return {};
  }

  return {
    y,
    transition: editorialTransition,
  };
}
