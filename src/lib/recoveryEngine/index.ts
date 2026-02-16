/**
 * Recovery Engine v1 — Rule-based biological recovery intelligence
 *
 * Orchestrates muscle recovery, CNS recovery, sleep, stress,
 * overtraining, and deload detection into a single recovery score.
 */

import type {
  RecoveryEngineInput,
  RecoveryScoreOutput,
  SleepLogInput,
  StressLogInput,
  WorkoutInput,
} from "./types";
import { calculateMuscleRecovery } from "./muscle";
import { calculateCNSRecovery } from "./cns";
import { calculateSleepScore, calculateSleepDebt } from "./sleep";
import { calculateStressModifier } from "./stress";
import { calculateTrainingLoadIndex } from "./load";
import { detectOvertraining } from "./overtraining";
import { detectDeloadNeed } from "./deload";

/** How many days of workouts to consider for recovery */
const WORKOUT_LOOKBACK_DAYS = 14;

/** How many days of sleep/stress to consider */
const SLEEP_STRESS_LOOKBACK_DAYS = 7;

export { calculateMuscleRecovery } from "./muscle";
export { calculateCNSRecovery } from "./cns";
export { calculateSleepScore, calculateSleepDebt } from "./sleep";
export { calculateStressModifier } from "./stress";
export { calculateTrainingLoadIndex } from "./load";
export { detectOvertraining } from "./overtraining";
export { detectDeloadNeed } from "./deload";
export { fetchRecoveryData } from "./fetchData";
export { saveRecoverySnapshot } from "./saveSnapshot";
export * from "./types";
export * from "./constants";

/**
 * Check if user is in an active deload period
 */
function isInDeloadPeriod(
  asOfDate: Date,
  deloadCycles: { start_date: string; end_date: string }[]
): boolean {
  const d = asOfDate.toISOString().slice(0, 10);
  return deloadCycles.some(
    (c) => d >= c.start_date && d <= c.end_date
  );
}

/**
 * Filter data to lookback windows
 */
function filterLookback<T extends { workout_date?: string; sleep_date?: string; log_date?: string }>(
  items: T[],
  asOfDate: Date,
  days: number,
  dateKey: "workout_date" | "sleep_date" | "log_date"
): T[] {
  const cutoff = new Date(asOfDate);
  cutoff.setDate(cutoff.getDate() - days);
  return items.filter((i) => {
    const dateStr = i[dateKey];
    if (!dateStr) return false;
    return new Date(dateStr) >= cutoff;
  });
}

/**
 * Project timestamp when full recovery is expected
 */
function projectFullRecovery(
  muscularScore: number,
  cnsScore: number,
  asOfDate: Date
): string | null {
  const limiting = Math.min(muscularScore, cnsScore);
  if (limiting >= 90) return null;

  const hoursToRecover = ((90 - limiting) / 90) * 72; // Up to ~72h
  const recovered = new Date(asOfDate.getTime() + hoursToRecover * 60 * 60 * 1000);
  return recovered.toISOString();
}

/**
 * Generate recommendation string
 */
function getRecommendation(
  overall: number,
  muscular: number,
  cns: number,
  sleep: number,
  overtraining: boolean,
  deload: boolean
): string {
  if (overtraining) {
    return "Overtraining risk detected. Prioritize rest, sleep, and nutrition. Consider taking 3–5 days completely off.";
  }
  if (deload) {
    return "Deload recommended. Reduce volume by 40–60% or take 1–2 rest days before resuming normal training.";
  }
  if (overall >= 85) {
    return "Full green light. Ready for high-intensity training.";
  }
  if (overall >= 70) {
    return "Good to train. Consider moderating intensity if targeting previously worked muscles.";
  }
  if (overall >= 50) {
    const focus: string[] = [];
    if (muscular < 50) focus.push("muscles");
    if (cns < 50) focus.push("CNS");
    if (sleep < 50) focus.push("sleep");
    return `Moderate recovery. Light activity or rest. Focus on: ${focus.join(", ") || "general recovery"}.`;
  }
  return "Low recovery. Prioritize rest, sleep, and stress management. Avoid high-intensity training.";
}

/**
 * Main recovery calculation — deterministic, rule-based
 */
export function calculateRecovery(
  input: RecoveryEngineInput,
  deloadCycles: { start_date: string; end_date: string }[] = []
): RecoveryScoreOutput {
  const asOfDate = new Date(input.asOfDate);

  const workouts = filterLookback(
    input.workouts,
    asOfDate,
    WORKOUT_LOOKBACK_DAYS,
    "workout_date"
  );
  const sleepLogs = filterLookback(
    input.sleepLogs,
    asOfDate,
    SLEEP_STRESS_LOOKBACK_DAYS,
    "sleep_date"
  );
  const stressLogs = filterLookback(
    input.stressLogs,
    asOfDate,
    SLEEP_STRESS_LOOKBACK_DAYS,
    "log_date"
  );

  const todaySleep = sleepLogs.find((s) => s.sleep_date === input.asOfDate.slice(0, 10));
  const todayStress = stressLogs.find((s) => s.log_date === input.asOfDate.slice(0, 10));

  const sleepScore = calculateSleepScore(
    (todaySleep as SleepLogInput) ?? null,
    sleepLogs as SleepLogInput[]
  );

  const hrvDeviation =
    input.recentHrvMs != null && input.baselineHrvMs != null && input.baselineHrvMs > 0
      ? ((input.recentHrvMs - input.baselineHrvMs) / input.baselineHrvMs) * 100
      : null;

  const stressModifier = calculateStressModifier(
    (todayStress as StressLogInput) ?? null,
    stressLogs as StressLogInput[],
    hrvDeviation
  );

  const stressScore = Math.round((stressModifier - 0.7) * (100 / 0.4));

  const muscularScore = calculateMuscleRecovery(
    workouts as WorkoutInput[],
    asOfDate,
    0.8 + (sleepScore / 100) * 0.4,
    stressModifier
  );

  const cnsScore = calculateCNSRecovery(
    workouts as WorkoutInput[],
    asOfDate,
    hrvDeviation
  );

  const overtrainingFlag = detectOvertraining(
    workouts as WorkoutInput[],
    asOfDate,
    [],
    sleepLogs as SleepLogInput[],
    stressLogs as StressLogInput[]
  );

  const inDeload = isInDeloadPeriod(asOfDate, deloadCycles);
  const deloadFlag = detectDeloadNeed(
    workouts as WorkoutInput[],
    asOfDate,
    muscularScore,
    cnsScore,
    inDeload
  );

  const overallScore = Math.round(
    muscularScore * 0.3 +
      cnsScore * 0.25 +
      sleepScore * 0.25 +
      stressScore * 0.2
  );
  const clampedOverall = Math.min(100, Math.max(0, overallScore));

  const recommendation = getRecommendation(
    clampedOverall,
    muscularScore,
    cnsScore,
    sleepScore,
    overtrainingFlag,
    deloadFlag
  );

  const projectedFullRecovery = projectFullRecovery(
    muscularScore,
    cnsScore,
    asOfDate
  );

  return {
    muscular_score: muscularScore,
    cns_score: cnsScore,
    sleep_score: sleepScore,
    stress_score: stressScore,
    overall_score: clampedOverall,
    recommendation,
    projected_full_recovery_timestamp: projectedFullRecovery,
    overtraining_flag: overtrainingFlag,
    deload_flag: deloadFlag,
    raw_data: {
      load_index: calculateTrainingLoadIndex(workouts as WorkoutInput[], asOfDate),
      sleep_debt: calculateSleepDebt(sleepLogs as SleepLogInput[]),
    },
  };
}
