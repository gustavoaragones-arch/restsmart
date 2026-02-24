/**
 * Phase 5 — Deterministic behavioral rules (habit layer).
 * Uses latest recovery snapshot, sleep data, and last 7 days of workouts.
 */

export interface BehavioralOutput {
  recoveryCompliant: boolean;
  sleepTargetMet: boolean;
  balancedTraining: boolean;
}

export interface BehavioralInput {
  /** Recommendation from recovery engine: "rest" | "moderate" | "train" */
  recommendation: string;
  /** Whether at least one workout was logged on the as-of date */
  workoutLoggedToday: boolean;
  /** Sleep debt in minutes (from recovery output) */
  sleepDebtMinutes: number;
  /** Dates (YYYY-MM-DD) that had at least one workout in the last 7 days (ascending) */
  last7DaysWorkoutDates: string[];
  /** Overtraining flag from recovery engine */
  overtrainingFlag: boolean;
}

const ONE_HOUR_MINUTES = 60;
const MAX_CONSECUTIVE_TRAINING_DAYS = 3;

/**
 * Recovery Compliance:
 * True if (recommendation === "rest" AND no workout that day)
 *     OR (recommendation === "train" AND workout logged).
 */
function recoveryCompliant(input: BehavioralInput): boolean {
  if (input.recommendation === "rest" && !input.workoutLoggedToday) return true;
  if (input.recommendation === "train" && input.workoutLoggedToday) return true;
  return false;
}

/**
 * Sleep Target Met:
 * True if sleepDebt <= 1 hour.
 */
function sleepTargetMet(sleepDebtMinutes: number): boolean {
  return sleepDebtMinutes <= ONE_HOUR_MINUTES;
}

/**
 * Max consecutive days with workouts in a sorted list of dates.
 */
function maxConsecutiveTrainingDays(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort();
  let maxRun = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      run += 1;
      maxRun = Math.max(maxRun, run);
    } else {
      run = 1;
    }
  }
  return maxRun;
}

/**
 * Balanced Training:
 * True if no more than 3 consecutive training days AND no overtrainingFlag.
 */
function balancedTraining(input: BehavioralInput): boolean {
  if (input.overtrainingFlag) return false;
  const maxConsec = maxConsecutiveTrainingDays(input.last7DaysWorkoutDates);
  return maxConsec <= MAX_CONSECUTIVE_TRAINING_DAYS;
}

/**
 * Compute daily behavioral booleans from recovery snapshot and activity.
 */
export function runBehaviorEngine(input: BehavioralInput): BehavioralOutput {
  return {
    recoveryCompliant: recoveryCompliant(input),
    sleepTargetMet: sleepTargetMet(input.sleepDebtMinutes),
    balancedTraining: balancedTraining(input),
  };
}
