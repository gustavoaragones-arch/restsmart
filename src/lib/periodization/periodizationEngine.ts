/**
 * Phase 7 — Deterministic deload detection from recovery trends.
 * Uses last 28 days snapshots; no ML; data-driven evaluation.
 */

import type { DeloadSnapshotRow } from "./fetchDeloadInput";

export interface DeloadOutput {
  deloadRecommended: boolean;
  reason: string | null;
  suggestedReductionPercent: number | null;
}

const TRAINING_WEEKS_MIN = 4;
const TREND_DAYS = 10;
const OVERTRAINING_DAYS_LOOKBACK = 14;
const OVERTRAINING_COUNT_MIN = 2;
const SLEEP_DEBT_HOURS_THRESHOLD = 5;
const SLEEP_DEBT_MINUTES_THRESHOLD = SLEEP_DEBT_HOURS_THRESHOLD * 60;
const SUGGESTED_REDUCTION_PERCENT = 30;

/**
 * Deload triggers only if ALL true:
 * - ≥ 4 weeks of consistent training load (we have ≥ 28 days of snapshot data)
 * - Downward trend in overallScore over last 10 days
 * - At least 2 overtrainingFlag=true days in last 14
 * - Sleep debt > 5h cumulative average
 */
export function runPeriodizationEngine(
  snapshots: DeloadSnapshotRow[],
  _asOfDate: string
): DeloadOutput {
  if (snapshots.length < 28) {
    return { deloadRecommended: false, reason: null, suggestedReductionPercent: null };
  }

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
  );

  const last10 = sorted.slice(-TREND_DAYS);
  if (last10.length < TREND_DAYS) {
    return { deloadRecommended: false, reason: null, suggestedReductionPercent: null };
  }

  const first5 = last10.slice(0, 5);
  const last5 = last10.slice(5, 10);
  const avgFirst = average(first5.map((s) => s.readiness_score ?? 0));
  const avgLast = average(last5.map((s) => s.readiness_score ?? 0));
  const downwardTrend = avgLast < avgFirst;

  const last14 = sorted.slice(-OVERTRAINING_DAYS_LOOKBACK);
  const overtrainingCount = last14.filter((s) => s.overtraining_flag).length;
  const overtrainingMet = overtrainingCount >= OVERTRAINING_COUNT_MIN;

  const avgSleepDebt = average(sorted.map((s) => s.sleep_debt ?? 0));
  const sleepDebtHigh = avgSleepDebt > SLEEP_DEBT_MINUTES_THRESHOLD;

  const fourWeeksData = sorted.length >= 28;

  const allTrue =
    fourWeeksData && downwardTrend && overtrainingMet && sleepDebtHigh;

  if (allTrue) {
    return {
      deloadRecommended: true,
      reason: "Accumulated fatigue trend detected",
      suggestedReductionPercent: SUGGESTED_REDUCTION_PERCENT,
    };
  }

  return { deloadRecommended: false, reason: null, suggestedReductionPercent: null };
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
