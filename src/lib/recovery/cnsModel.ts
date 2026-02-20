/**
 * CNS recovery model — half-life by intensity, modified by deep sleep, HRV, stress
 */

import type { WorkoutInput } from "./types";
import { clamp, safeNumber, hoursBetween } from "./utils";

const CNS_PATTERNS = [
  /\b(hiit|sprint|interval|metcon|wod|amrap|emom)\b/i,
  /\b(max|1rm|heavy|deadlift|squat|clean|snatch|jerk|oly)\b/i,
  /\b(power|explosive|plyometric)\b/i,
];

function isHighCNS(workout: WorkoutInput): boolean {
  const rpe = safeNumber(workout.perceived_exertion, 0);
  if (rpe >= 8) return true;
  const name = String(workout.name ?? "");
  if (CNS_PATTERNS.some((p) => p.test(name))) return true;
  for (const ex of workout.exercises ?? []) {
    if (CNS_PATTERNS.some((p) => p.test(String(ex?.exercise_name ?? "")))) return true;
  }
  return false;
}

function halfLifeHours(workout: WorkoutInput): number {
  const rpe = clamp(safeNumber(workout.perceived_exertion, 6), 1, 10);
  const high = isHighCNS(workout);
  if (rpe >= 9 || high) return clamp(96 + 24 * (rpe / 10), 48, 120);
  if (rpe >= 8) return 72;
  return 48;
}

/**
 * CNS recovery: 1 - e^(-ln2 * t / halfLife) → 0 to 1. Never negative.
 */
function recoveryAt(hoursElapsed: number, halfLife: number): number {
  if (hoursElapsed <= 0 || !Number.isFinite(hoursElapsed)) return 0;
  const safeHalf = Math.max(1, halfLife);
  const r = 1 - Math.exp((-Math.LN2 * hoursElapsed) / safeHalf);
  return clamp(r, 0, 1);
}

export interface CnsModelOutput {
  cnsScore: number;
  projectedFullRecovery: string | null;
}

const LOOKBACK_DAYS = 14;

export function evaluateCnsModel(
  workouts: WorkoutInput[],
  asOfDate: string,
  deepSleepMinutesLastNight: number | null,
  hrvDeviationPercent: number | null,
  stressModifier: number
): CnsModelOutput {
  const asOf = new Date(asOfDate);
  if (Number.isNaN(asOf.getTime())) {
    return { cnsScore: 100, projectedFullRecovery: null };
  }
  const cutoff = new Date(asOf);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  const stressMod = clamp(safeNumber(stressModifier, 1), 0.8, 1.1);

  const validWorkouts = Array.isArray(workouts) ? workouts : [];
  let worstRecovery = 1;
  let latestHeavyTime = 0;
  let hasHighIntensity = false;

  for (const w of validWorkouts) {
    const workoutDate = new Date(w.workout_date);
    if (Number.isNaN(workoutDate.getTime()) || workoutDate > asOf || workoutDate < cutoff) continue;

    const halfLife = halfLifeHours(w);
    let effectiveHalfLife = halfLife;

    if (deepSleepMinutesLastNight != null && Number.isFinite(deepSleepMinutesLastNight) && deepSleepMinutesLastNight < 60) {
      effectiveHalfLife *= 1.2;
    }
    if (hrvDeviationPercent != null && Number.isFinite(hrvDeviationPercent) && hrvDeviationPercent < -10) {
      effectiveHalfLife *= 1.1;
    }
    effectiveHalfLife = Math.max(1, effectiveHalfLife / stressMod);

    const hoursElapsed = hoursBetween(workoutDate, asOf);
    const rec = recoveryAt(hoursElapsed, effectiveHalfLife);
    worstRecovery = Math.min(worstRecovery, rec);
    if (isHighCNS(w) || (safeNumber(w.perceived_exertion, 0) >= 8)) {
      hasHighIntensity = true;
      latestHeavyTime = Math.max(latestHeavyTime, workoutDate.getTime());
    }
  }

  if (!hasHighIntensity) {
    return { cnsScore: 100, projectedFullRecovery: null };
  }

  const cnsScore = clamp(Math.round(worstRecovery * 100), 0, 100);

  let projectedFullRecovery: string | null = null;
  if (worstRecovery < 0.95 && latestHeavyTime > 0) {
    const halfLife = 96;
    const hoursTo99 = (halfLife / Math.LN2) * Math.log(100);
    const fullAt = new Date(latestHeavyTime + hoursTo99 * 60 * 60 * 1000);
    if (fullAt.getTime() > asOf.getTime()) {
      projectedFullRecovery = fullAt.toISOString();
    }
  }

  return { cnsScore, projectedFullRecovery };
}
