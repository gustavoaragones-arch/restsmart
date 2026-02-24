/**
 * Phase 5B — Deterministic streak from behavioral_metrics.
 * Missing day breaks streak. Future dates ignored. Max lookback 60 days.
 */

import type { BehaviorRow } from "./fetchBehaviorHistory";

export interface StreakOutput {
  recoveryStreak: number;
  sleepStreak: number;
  balanceStreak: number;
}

const MAX_LOOKBACK_DAYS = 60;

/**
 * Count consecutive days (including today) where the predicate is true.
 * Walk backwards from asOfDate; missing day or first false breaks.
 */
function countStreak(
  rowsByDate: Map<string, BehaviorRow>,
  asOfDate: string,
  getValue: (row: BehaviorRow) => boolean
): number {
  let count = 0;
  const start = new Date(asOfDate.slice(0, 10));
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const row = rowsByDate.get(dateStr);
    if (row == null) break;
    if (!getValue(row)) break;
    count += 1;
  }
  return count;
}

/**
 * Compute streaks from behavior history (ordered DESC by date).
 * asOfDate = today (YYYY-MM-DD).
 */
export function runStreakEngine(history: BehaviorRow[], asOfDate: string): StreakOutput {
  const dateOnly = asOfDate.slice(0, 10);
  const rowsByDate = new Map<string, BehaviorRow>();
  const today = new Date(dateOnly);
  for (const row of history) {
    const rowDate = row.date.slice(0, 10);
    const rowTime = new Date(rowDate).getTime();
    if (rowTime > today.getTime()) continue;
    if (!rowsByDate.has(rowDate)) {
      rowsByDate.set(rowDate, row);
    }
  }

  return {
    recoveryStreak: countStreak(rowsByDate, dateOnly, (r) => r.recovery_compliant),
    sleepStreak: countStreak(rowsByDate, dateOnly, (r) => r.sleep_target_met),
    balanceStreak: countStreak(rowsByDate, dateOnly, (r) => r.balanced_training),
  };
}
