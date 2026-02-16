/**
 * CNS (Central Nervous System) recovery model
 * Heavily influenced by HIIT, max lifts, RPE ≥ 9, HRV
 * Half-life 48–120 hours depending on intensity
 */

import type { WorkoutInput } from "./types";
import { CNS_RECOVERY_HALFLIFE_MIN, CNS_RECOVERY_HALFLIFE_MAX } from "./constants";

/** Exercise name patterns indicating high CNS demand */
const CNS_DEMAND_PATTERNS = [
  /\b(hiit|sprint|interval|metcon|wod|amrap|emom)\b/i,
  /\b(max|1rm|heavy|deadlift|squat|clean|snatch|jerk|oly)\b/i,
  /\b(power|explosive|plyometric|jump)\b/i,
  /\b(bench press|overhead press)\b/i,
];

function isHighCnsWorkout(workout: WorkoutInput): boolean {
  const rpe = workout.perceived_exertion ?? 0;
  if (rpe >= 9) return true;

  const name = workout.name ?? "";
  if (CNS_DEMAND_PATTERNS.some((p) => p.test(name))) return true;

  const exercises = workout.exercises ?? [];
  for (const ex of exercises) {
    if (CNS_DEMAND_PATTERNS.some((p) => p.test(ex.exercise_name))) return true;
  }

  return false;
}

/**
 * CNS recovery curve (exponential decay)
 * Returns 0–1, 1 = fully recovered
 */
function cnsRecoveryCurve(hoursSince: number, halfLife: number): number {
  if (hoursSince <= 0) return 0;
  return 1 - Math.exp(-0.693 * (hoursSince / halfLife));
}

/**
 * Calculate CNS recovery score (0–100)
 */
export function calculateCNSRecovery(
  workouts: WorkoutInput[],
  asOfDate: Date,
  hrvDeviation?: number | null
): number {
  let totalCnsLoad = 0;
  let worstRecovery = 1;

  for (const workout of workouts) {
    const workoutDate = new Date(workout.workout_date);
    const hoursSince = (asOfDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60);

    const rpe = workout.perceived_exertion ?? 6;
    const isHighCns = isHighCnsWorkout(workout);

    // Half-life: high CNS = 120h, low = 48h
    const halfLife = isHighCns
      ? CNS_RECOVERY_HALFLIFE_MAX
      : CNS_RECOVERY_HALFLIFE_MIN - (10 - rpe) * 5;
    const adjustedHalfLife = Math.max(CNS_RECOVERY_HALFLIFE_MIN, Math.min(CNS_RECOVERY_HALFLIFE_MAX, halfLife));

    const cnsLoad = isHighCns ? (rpe / 10) * 1.5 : (rpe / 10) * 0.5;
    const recovery = cnsRecoveryCurve(hoursSince, adjustedHalfLife);

    totalCnsLoad += cnsLoad * (1 - recovery);
    worstRecovery = Math.min(worstRecovery, recovery);
  }

  // HRV penalty: low HRV vs baseline suggests CNS stress
  let hrvPenalty = 0;
  if (hrvDeviation != null && hrvDeviation < -10) {
    hrvPenalty = Math.min(20, Math.abs(hrvDeviation) / 2);
  }

  const raw = 100 - Math.min(100, totalCnsLoad * 80) - hrvPenalty;
  return Math.round(Math.max(0, Math.min(100, raw)));
}
