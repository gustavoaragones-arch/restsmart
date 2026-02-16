/**
 * Sleep scoring and debt calculation
 */

import type { SleepLogInput } from "./types";
import {
  OPTIMAL_SLEEP_MINUTES,
  SLEEP_DEBT_LOOKBACK_DAYS,
} from "./constants";

/**
 * Calculate sleep quality score (0–100)
 * Combines duration, self-reported quality, and sleep stage composition
 */
export function calculateSleepScore(
  sleepLog: SleepLogInput | null,
  lookbackLogs: SleepLogInput[] = []
): number {
  if (!sleepLog) {
    // No data: use recent average or neutral
    if (lookbackLogs.length === 0) return 70;
    const avg = lookbackLogs.reduce((sum, l) => sum + scoreSingleSleep(l), 0) / lookbackLogs.length;
    return Math.round(avg);
  }

  return scoreSingleSleep(sleepLog);
}

function scoreSingleSleep(log: SleepLogInput): number {
  const duration = log.total_minutes ?? 0;
  const quality = log.quality ?? 7;
  const deep = log.deep_sleep_minutes ?? 0;
  const rem = log.rem_minutes ?? 0;
  const awakenings = log.awakenings ?? 0;

  // Duration score (0–100): optimal 7–9h, penalize <6h or >10h
  let durationScore = 100;
  if (duration > 0) {
    if (duration < 360) durationScore = Math.max(0, 40 + (duration / 360) * 40);
    else if (duration < 420) durationScore = 60 + ((duration - 360) / 60) * 20;
    else if (duration <= 540) durationScore = 100;
    else if (duration <= 600) durationScore = 100 - ((duration - 540) / 60) * 15;
    else durationScore = Math.max(50, 85 - (duration - 600) / 60);
  } else {
    durationScore = 50;
  }

  // Quality self-report (1–10 → 40–100)
  const qualityScore = 40 + quality * 6;

  // Sleep architecture bonus: deep + REM as % of total
  const total = duration || 1;
  const deepRemPct = (deep + rem) / total;
  const architectureBonus = deepRemPct >= 0.4 ? 10 : deepRemPct >= 0.3 ? 5 : 0;

  // Awakening penalty
  const awakeningPenalty = Math.min(15, awakenings * 3);

  const raw = (durationScore * 0.4 + qualityScore * 0.5 + architectureBonus - awakeningPenalty);
  return Math.round(Math.min(100, Math.max(0, raw)));
}

/**
 * Calculate sleep debt (cumulative deficit over lookback period)
 * Positive = deficit, negative = surplus
 */
export function calculateSleepDebt(sleepLogs: SleepLogInput[]): number {
  if (sleepLogs.length === 0) return 0;

  const sorted = [...sleepLogs].sort(
    (a, b) => new Date(b.sleep_date).getTime() - new Date(a.sleep_date).getTime()
  );
  const recent = sorted.slice(0, SLEEP_DEBT_LOOKBACK_DAYS);

  let totalDeficit = 0;
  for (const log of recent) {
    const minutes = log.total_minutes ?? 0;
    const deficit = OPTIMAL_SLEEP_MINUTES - minutes;
    totalDeficit += Math.max(0, deficit);
  }

  return totalDeficit;
}
