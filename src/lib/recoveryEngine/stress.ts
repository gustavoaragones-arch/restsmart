/**
 * Stress modifier calculation
 */

import type { StressLogInput } from "./types";

/**
 * Stress modifier (0.7–1.1)
 * High stress reduces recovery capacity; low stress enhances it
 */
export function calculateStressModifier(
  stressLog: StressLogInput | null,
  recentLogs: StressLogInput[] = [],
  hrvDeviation?: number | null // % deviation from baseline (negative = stressed)
): number {
  let stressLevel = 5; // Neutral 1–10

  if (stressLog?.stress_level != null) {
    stressLevel = stressLog.stress_level;
  } else if (recentLogs.length > 0) {
    const avg =
      recentLogs.reduce((s, l) => s + (l.stress_level ?? 5), 0) / recentLogs.length;
    stressLevel = avg;
  }

  // Stress 1–10 maps to modifier 1.1–0.7
  // 1 → 1.1, 5 → 0.9, 10 → 0.7
  let modifier = 1.1 - (stressLevel - 1) * (0.4 / 9);

  // HRV deviation: if HRV is low vs baseline, reduce modifier
  if (hrvDeviation != null && hrvDeviation < 0) {
    const hrvPenalty = Math.min(0.15, Math.abs(hrvDeviation) / 100);
    modifier -= hrvPenalty;
  }

  return Math.max(0.7, Math.min(1.1, modifier));
}
