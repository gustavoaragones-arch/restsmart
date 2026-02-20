/**
 * Trend model — overtraining and deload detection from snapshots and workload.
 * overtrainingFlag and deloadFlag are returned and persisted to recovery_snapshots via recoveryEngine + saveSnapshot.
 */

import type { WorkoutInput, RecoverySnapshotInput } from "./types";
import { safeNumber } from "./utils";

export interface TrendModelOutput {
  overtrainingFlag: boolean;
  deloadFlag: boolean;
}

const OVERTRAINING_RECOVERY_DOWN_DAYS = 5;
const OVERTRAINING_CONSECUTIVE_TRAINING_DAYS = 6;
const OVERTRAINING_SLEEP_DEBT_HOURS = 8;
const DELOAD_WEEKS_CONSISTENT_LOAD = 4;
const DELOAD_CNS_SUPPRESSION_DAYS = 5;
const DELOAD_MIN_DAYS_DATA = 28;

export function evaluateTrendModel(
  recentSnapshots: RecoverySnapshotInput[],
  workouts: WorkoutInput[],
  sleepDebtMinutes: number,
  cnsScore: number
): TrendModelOutput {
  const sorted = [...(Array.isArray(recentSnapshots) ? recentSnapshots : [])].sort(
    (a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
  );

  let recoveryTrendingDown = false;
  if (sorted.length >= OVERTRAINING_RECOVERY_DOWN_DAYS) {
    const scores = sorted.slice(0, OVERTRAINING_RECOVERY_DOWN_DAYS).map(
      (s) => safeNumber(s.readiness_score, 70)
    );
    let down = true;
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] >= scores[i - 1]) {
        down = false;
        break;
      }
    }
    recoveryTrendingDown = down;
  }

  const validWorkouts = Array.isArray(workouts) ? workouts : [];
  const workoutDates = new Set(
    validWorkouts
      .map((w) => w.workout_date)
      .filter((d) => d != null && !Number.isNaN(new Date(d).getTime()))
  );
  const sortedDates = Array.from(workoutDates).sort();
  let maxConsecutive = 0;
  let current = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    const d = new Date(sortedDates[i]);
    if (i === 0) {
      current = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const diffDays = (d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1.5) current++;
      else current = 1;
    }
    maxConsecutive = Math.max(maxConsecutive, current);
  }

  const sleepDebtHours = Math.max(0, safeNumber(sleepDebtMinutes, 0)) / 60;
  const overtrainingFromTrend = recoveryTrendingDown && sorted.length >= OVERTRAINING_RECOVERY_DOWN_DAYS;
  const overtrainingFlag =
    overtrainingFromTrend ||
    maxConsecutive >= OVERTRAINING_CONSECUTIVE_TRAINING_DAYS ||
    sleepDebtHours > OVERTRAINING_SLEEP_DEBT_HOURS;

  const asOfDate = sorted[0]?.snapshot_date ?? new Date().toISOString().slice(0, 10);
  const asOf = new Date(asOfDate);
  const lookbackWeeks = DELOAD_WEEKS_CONSISTENT_LOAD * 7;
  const cutoff = new Date(asOf);
  cutoff.setDate(cutoff.getDate() - Math.max(lookbackWeeks, DELOAD_MIN_DAYS_DATA));

  const recentWorkouts = validWorkouts.filter((w) => {
    const d = new Date(w.workout_date);
    return !Number.isNaN(d.getTime()) && d >= cutoff;
  });

  const daysSpan = sorted.length >= 2
    ? (new Date(sorted[0].snapshot_date).getTime() - new Date(sorted[sorted.length - 1].snapshot_date).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const hasEnoughDataForDeload = daysSpan >= DELOAD_MIN_DAYS_DATA || recentWorkouts.length >= 10;

  const weeksWithLoad = new Set<string>();
  for (const w of recentWorkouts) {
    const d = new Date(w.workout_date);
    if (Number.isNaN(d.getTime())) continue;
    const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
    weeksWithLoad.add(weekKey);
  }
  const consistentLoad = weeksWithLoad.size >= DELOAD_WEEKS_CONSISTENT_LOAD && hasEnoughDataForDeload;

  const downwardTrend = sorted.length >= 3 && (() => {
    const s = sorted.slice(0, 3).map((x) => safeNumber(x.readiness_score, 70));
    return s[0] < s[1] && s[1] < s[2];
  })();

  const safeCns = safeNumber(cnsScore, 70);
  const repeatedCnsSuppression = safeCns < 50 && sorted.length >= DELOAD_CNS_SUPPRESSION_DAYS;

  const deloadFlag =
    hasEnoughDataForDeload &&
    ((consistentLoad && downwardTrend) || (consistentLoad && repeatedCnsSuppression));

  return { overtrainingFlag: !!overtrainingFlag, deloadFlag: !!deloadFlag };
}
