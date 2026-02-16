/**
 * Deload need detection
 */

import type { WorkoutInput } from "./types";
import { calculateTrainingLoadIndex } from "./load";

/** Load threshold suggesting deload */
const DELOAD_LOAD_THRESHOLD = 1.4;

/** Consecutive high-intensity days before suggesting deload */
const CONSECUTIVE_HARD_DAYS = 4;

/**
 * Detect if user should consider a deload
 */
export function detectDeloadNeed(
  workouts: WorkoutInput[],
  asOfDate: Date,
  muscularScore: number,
  cnsScore: number,
  inDeloadPeriod: boolean
): boolean {
  if (inDeloadPeriod) return false;

  const loadIndex = calculateTrainingLoadIndex(workouts, asOfDate);

  // Very high load
  if (loadIndex >= DELOAD_LOAD_THRESHOLD) return true;

  // Both systems depleted
  if (muscularScore < 40 && cnsScore < 40) return true;

  // High load + one system depleted
  if (loadIndex >= 1.2 && (muscularScore < 45 || cnsScore < 45)) return true;

  // Consecutive hard days
  const cutoff = new Date(asOfDate);
  cutoff.setDate(cutoff.getDate() - CONSECUTIVE_HARD_DAYS);
  const recent = workouts.filter((w) => new Date(w.workout_date) >= cutoff);
  const hardDays = recent.filter((w) => (w.perceived_exertion ?? 0) >= 8);
  if (hardDays.length >= CONSECUTIVE_HARD_DAYS) return true;

  return false;
}
