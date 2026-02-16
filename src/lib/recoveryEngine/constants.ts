/**
 * Recovery Engine v1 — Biological constants
 */

/** Muscle group size weighting (relative mass / recovery demand) */
export const MUSCLE_GROUP_WEIGHTS: Record<string, number> = {
  legs: 1.0,
  quadriceps: 0.9,
  hamstrings: 0.5,
  glutes: 0.7,
  back: 0.9,
  chest: 0.7,
  shoulders: 0.5,
  biceps: 0.25,
  triceps: 0.25,
  core: 0.6,
  abs: 0.4,
  calves: 0.2,
  traps: 0.3,
  lats: 0.5,
  forearms: 0.2,
  default: 0.5,
};

/** Intensity multipliers for primary/secondary/tertiary muscle involvement */
export const INTENSITY_MULTIPLIERS = {
  primary: 1.0,
  secondary: 0.6,
  tertiary: 0.3,
} as const;

/** Muscle recovery half-life in hours (sigmoid midpoint) */
export const MUSCLE_RECOVERY_HALFLIFE_HOURS = 48;

/** CNS recovery half-life range in hours */
export const CNS_RECOVERY_HALFLIFE_MIN = 48;
export const CNS_RECOVERY_HALFLIFE_MAX = 120;

/** Optimal sleep duration in minutes */
export const OPTIMAL_SLEEP_MINUTES = 480; // 8 hours

/** Sleep debt decay days (how long to average) */
export const SLEEP_DEBT_LOOKBACK_DAYS = 7;
