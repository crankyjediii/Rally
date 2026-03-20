/**
 * Rally Motion System
 * Central animation config — import from here instead of defining inline.
 * All variants are compatible with Framer Motion's `Variants` type.
 */
import type { Variants } from 'framer-motion';

// ── Easing ───────────────────────────────────────────────────────────────────

/** Fluid deceleration — the primary easing curve used throughout Rally */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

/** Fast entry, balanced exit */
export const EASE_IN_OUT = [0.37, 0, 0.63, 1] as const;

// ── Spring Presets ────────────────────────────────────────────────────────────

/** Snappy, responsive — for buttons, chips, logo hover */
export const EASE_SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 28,
};

/** Gentle, smooth — for cards lifting, subtle hovers */
export const EASE_SPRING_SOFT = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 24,
};

/** Bouncy, celebratory — for success states, popIn */
export const EASE_SPRING_BOUNCY = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 18,
};

/** Silky smooth — for page-level transitions and gentle lifestyle reveals */
export const EASE_SPRING_SILKY = {
  type: 'spring' as const,
  stiffness: 160,
  damping: 22,
};

// ── Duration Constants ────────────────────────────────────────────────────────

export const DUR = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
} as const;

// ── Core Variants ─────────────────────────────────────────────────────────────

/**
 * Fade up with optional stagger index.
 * Usage: `<motion.div variants={fadeUp} custom={i} />`
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: DUR.slow,
      ease: EASE_OUT_EXPO,
    },
  }),
};

/**
 * Gentle fade up — softer motion for lifestyle sections.
 * Smaller movement, longer duration, subtler stagger.
 */
export const fadeUpGentle: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.6,
      ease: EASE_OUT_EXPO,
    },
  }),
};

/**
 * Heavier card reveal — more drama than fadeUp.
 * Use for stop cards, feature cards, route cards.
 */
export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DUR.slow,
      ease: EASE_OUT_EXPO,
    },
  },
};

/**
 * Slide in from right — for wizard step transitions.
 * Use with `AnimatePresence mode="wait"`.
 */
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DUR.normal, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    x: -24,
    transition: { duration: 0.2 },
  },
};

/**
 * Slide in from left — for going backwards in wizard.
 */
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DUR.normal, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: { duration: 0.2 },
  },
};

/**
 * Pop/bounce in — for success states, emojis, trophies.
 */
export const popIn: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: EASE_SPRING_BOUNCY,
  },
};

/**
 * Stagger container — orchestrates children's stagger.
 * Usage: parent gets this variant, children get `fadeUp` or `cardReveal`.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

/**
 * Faster stagger — for denser lists where you want quicker cascades.
 */
export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

/**
 * Simple fade in — no movement.
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DUR.normal },
  },
};

/**
 * Scale in with opacity — for modals, popovers.
 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DUR.normal, ease: EASE_OUT_EXPO },
  },
};

/**
 * Soft pulse — for live indicators, location pings.
 * Use with `animate` prop (not variants).
 */
export const softPulseDef = {
  animate: {
    scale: [1, 1.15, 1],
    opacity: [0.5, 0.8, 0.5],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

/**
 * Sonar ping — expanding ring for location indicators.
 */
export const sonarPingDef = {
  animate: {
    scale: [1, 1.8, 1],
    opacity: [0.4, 0, 0.4],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeOut' as const,
  },
};
