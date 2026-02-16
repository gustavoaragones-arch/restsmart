/**
 * Overtraining and deload detection
 */

import type { WorkoutInput, SleepLogInput, StressLogInput } from "./types";
import { calculateTrainingLoadIndex } from "./load";
import { calculateSleepDebt } from "./sleep";

/** Overtraining load threshold */
const OVERTRAINING_LOAD_THRESHOLD = 1.5;

/** Consecutive low recovery days to flag overtraining */
const LOW_RECOVERY_DAYS_THRESHOLD = 5;

/** Sleep debt threshold (minutes) to contribute to overtraining */
const OVERTRAINING_SLEEP_DEBT_THRESHOLD = 300; // 5 hours over 7 days

/**
 * Detect overtraining risk
 */
export function detectOvertraining(
  workouts: WorkoutInput[],
  asOfDate: Date,
  recentRecoveryScores: number[],
  sleepLogs: SleepLogInput[],
  stressLogs: StressLogInput[]
): boolean {
  const loadIndex = calculateTrainingLoadIndex(workouts, asOfDate);
  const sleepDebt = calculateSleepDebt(sleepLogs);
  const avgStress =
    stressLogs.length > 0
      ? stressLogs.reduce((s, l) => s + (l.stress_level ?? 5), 0) / stressLogs.length
      : 5;

  // High acute:chronic load
  if (loadIndex >= OVERTRAINING_LOAD_THRESHOLD) return true;

  // Sustained low recovery
  const lowDays = recentRecoveryScores.filter((s) => s < 50).length;
  if (lowDays >= LOW_RECOVERY_DAYS_THRESHOLD) return true;

  // High load + sleep debt
  if (loadIndex >= 1.3 && sleepDebt >= OVERTRAINING_SLEEP_DEBT_THRESHOLD) return true;

  // High load + high stress
  if (loadIndex >= 1.3 && avgStress >= 7) return true;

  return false;
}
