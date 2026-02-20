/**
 * Stress model — map level to modifier and score
 */

import type { StressLogInput } from "./types";
import { clamp, safeNumber } from "./utils";

const STRESS_MAP: Record<string, { modifier: number; label: string }> = {
  low: { modifier: 1.1, label: "low" },
  moderate: { modifier: 1.0, label: "moderate" },
  high: { modifier: 0.9, label: "high" },
  very_high: { modifier: 0.8, label: "very_high" },
};

function levelFromStressValue(stressLevel: number): keyof typeof STRESS_MAP {
  const s = clamp(stressLevel, 1, 10);
  if (s <= 3) return "low";
  if (s <= 5) return "moderate";
  if (s <= 7) return "high";
  return "very_high";
}

export interface StressModelOutput {
  stressScore: number;
  stressModifier: number;
  stressLevel: keyof typeof STRESS_MAP;
}

const LOOKBACK_DAYS = 7;

export function evaluateStressModel(
  stressLogs: StressLogInput[],
  asOfDate: string
): StressModelOutput {
  const asOf = new Date(asOfDate);
  if (Number.isNaN(asOf.getTime())) {
    return { stressScore: 70, stressModifier: 1, stressLevel: "moderate" };
  }
  const cutoff = new Date(asOf);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  const list = Array.isArray(stressLogs) ? stressLogs : [];
  const recent = list.filter((s) => {
    const d = new Date(s.log_date);
    return !Number.isNaN(d.getTime()) && d >= cutoff && d <= asOf;
  });

  const levels = recent
    .map((s) => safeNumber(s.stress_level, 5))
    .filter((v) => Number.isFinite(v));
  const avg = levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 5;
  const level = levelFromStressValue(avg);
  const { modifier } = STRESS_MAP[level];

  const stressScore = clamp(Math.round(100 - (avg - 1) * (100 / 9)), 0, 100);

  return {
    stressScore,
    stressModifier: modifier,
    stressLevel: level,
  };
}
