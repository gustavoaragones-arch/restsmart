/**
 * Sleep model — last 7 days: nightly score, sleep debt, deep sleep ratio, recoveryModifier
 */

import type { SleepLogInput } from "./types";
import { clamp, safeNumber } from "./utils";

const LOOKBACK_DAYS = 7;
const OPTIMAL_MINUTES = 480;

function nightlyScore(log: SleepLogInput): number {
  const total = Math.max(0, safeNumber(log.total_minutes, 0));
  const quality = clamp(safeNumber(log.quality, 5), 1, 10);
  const deep = Math.max(0, safeNumber(log.deep_sleep_minutes, 0));
  const rem = Math.max(0, safeNumber(log.rem_minutes, 0));
  const awakenings = Math.max(0, safeNumber(log.awakenings, 0));

  let durationScore = 50;
  if (total >= 420 && total <= 540) durationScore = 100;
  else if (total >= 360) durationScore = 70 + ((total - 360) / 60) * 15;
  else if (total > 0) durationScore = Math.max(0, 30 + (total / 360) * 40);

  const qualityScore = quality * 10;
  const deepRemRatio = total > 0 ? (deep + rem) / total : 0;
  const archBonus = deepRemRatio >= 0.35 ? 10 : 0;
  const awakenPenalty = Math.min(15, awakenings * 3);

  return clamp(durationScore * 0.4 + qualityScore * 0.5 + archBonus - awakenPenalty, 0, 100);
}

export interface SleepModelOutput {
  nightlyScores: number[];
  sleepScore: number;
  cumulativeSleepDebtMinutes: number;
  deepSleepRatio: number;
  recoveryModifier: number;
}

export function evaluateSleepModel(sleepLogs: SleepLogInput[], asOfDate: string): SleepModelOutput {
  const asOf = new Date(asOfDate);
  if (Number.isNaN(asOf.getTime())) {
    return {
      nightlyScores: [],
      sleepScore: 70,
      cumulativeSleepDebtMinutes: 0,
      deepSleepRatio: 0,
      recoveryModifier: 1,
    };
  }
  const cutoff = new Date(asOf);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  const list = Array.isArray(sleepLogs) ? sleepLogs : [];
  const recent = list
    .filter((s) => {
      const d = new Date(s.sleep_date);
      return !Number.isNaN(d.getTime()) && d >= cutoff && d <= asOf;
    })
    .sort((a, b) => b.sleep_date.localeCompare(a.sleep_date));

  const nightlyScores = recent.map(nightlyScore);
  const sleepScore =
    nightlyScores.length > 0
      ? clamp(
          nightlyScores.reduce((a, b) => a + b, 0) / nightlyScores.length,
          0,
          100
        )
      : 70;

  let cumulativeDebt = 0;
  for (const s of recent) {
    const total = Math.max(0, safeNumber(s.total_minutes, 0));
    if (total < OPTIMAL_MINUTES) cumulativeDebt += OPTIMAL_MINUTES - total;
  }
  cumulativeDebt = Math.max(0, cumulativeDebt);

  let totalDeep = 0;
  let totalSleep = 0;
  for (const s of recent) {
    const t = Math.max(0, safeNumber(s.total_minutes, 0));
    totalSleep += t;
    totalDeep += Math.max(0, safeNumber(s.deep_sleep_minutes, 0));
  }
  const deepSleepRatio = totalSleep > 0 ? clamp(totalDeep / totalSleep, 0, 1) : 0;

  const scoreNorm = clamp(sleepScore / 100, 0, 1);
  const recoveryModifier = clamp(0.8 + scoreNorm * 0.4, 0.8, 1.2);

  return {
    nightlyScores,
    sleepScore: clamp(Math.round(sleepScore), 0, 100),
    cumulativeSleepDebtMinutes: cumulativeDebt,
    deepSleepRatio,
    recoveryModifier,
  };
}
