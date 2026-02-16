/**
 * Training load index and overtraining/deload detection
 */

import type { WorkoutInput } from "./types";

/** Lookback period for load calculation (days) */
const LOAD_LOOKBACK_DAYS = 14;

/**
 * Calculate training load index (acute:chronic ratio style)
 * Higher = more cumulative fatigue
 */
export function calculateTrainingLoadIndex(
  workouts: WorkoutInput[],
  asOfDate: Date
): number {
  if (workouts.length === 0) return 0;

  const cutoff = new Date(asOfDate);
  cutoff.setDate(cutoff.getDate() - LOAD_LOOKBACK_DAYS);

  let acuteLoad = 0; // Last 7 days
  let chronicLoad = 0; // Full 14 days

  const acuteCutoff = new Date(asOfDate);
  acuteCutoff.setDate(acuteCutoff.getDate() - 7);

  for (const w of workouts) {
    const d = new Date(w.workout_date);
    if (d < cutoff) continue;

    const rpe = w.perceived_exertion ?? 6;
    const dur = w.duration_minutes ?? 45;
    const load = rpe * dur;

    chronicLoad += load;
    if (d >= acuteCutoff) acuteLoad += load;
  }

  if (chronicLoad === 0) return 0;
  const ratio = acuteLoad / (chronicLoad / 2);
  return Math.round(ratio * 10) / 10;
}
