/**
 * Main recovery engine — combines muscle, CNS, sleep, stress, trend models
 */

import type { RecoveryEngineInput } from "./types";
import { clamp } from "./utils";
import { evaluateMuscleModel } from "./muscleModel";
import { evaluateCnsModel } from "./cnsModel";
import { evaluateSleepModel } from "./sleepModel";
import { evaluateStressModel } from "./stressModel";
import { evaluateTrendModel } from "./trendModel";

export interface RecoveryEngineOutput {
  muscularScore: number;
  muscleBreakdown: Record<string, number>;
  cnsScore: number;
  sleepScore: number;
  sleepDebt: number;
  stressScore: number;
  overallScore: number;
  recommendation: string;
  projectedFullRecovery: string | null;
  overtrainingFlag: boolean;
  deloadFlag: boolean;
  generatedAt: string;
  /** @internal */
  recoveryModifier?: number;
}

export function runRecoveryEngine(input: RecoveryEngineInput): RecoveryEngineOutput {
  const { asOfDate, workouts, sleepLogs, stressLogs, recentSnapshots, recentHrvMs, baselineHrvMs, ageYears } = input;

  const sleepOutput = evaluateSleepModel(sleepLogs, asOfDate);
  const stressOutput = evaluateStressModel(stressLogs, asOfDate);

  const ageFactor = ageYears != null && ageYears >= 40 ? 0.95 : 1;

  const muscleOutput = evaluateMuscleModel(
    workouts,
    asOfDate,
    sleepOutput.recoveryModifier,
    stressOutput.stressModifier,
    ageFactor
  );

  const hrvDeviation =
    recentHrvMs != null && baselineHrvMs != null && baselineHrvMs > 0
      ? ((recentHrvMs - baselineHrvMs) / baselineHrvMs) * 100
      : null;

  const lastNightSleep = sleepLogs.find((s) => s.sleep_date === asOfDate.slice(0, 10));
  const deepSleepLastNight = lastNightSleep?.deep_sleep_minutes ?? null;

  const cnsOutput = evaluateCnsModel(
    workouts,
    asOfDate,
    deepSleepLastNight,
    hrvDeviation,
    stressOutput.stressModifier
  );

  const trendOutput = evaluateTrendModel(
    recentSnapshots,
    workouts,
    sleepOutput.cumulativeSleepDebtMinutes,
    cnsOutput.cnsScore
  );

  const overallScore = Math.round(
    muscleOutput.muscularScore * 0.4 +
      cnsOutput.cnsScore * 0.3 +
      sleepOutput.sleepScore * 0.2 +
      stressOutput.stressScore * 0.1
  );
  const clampedOverall = clamp(overallScore, 0, 100);

  let recommendation: string;
  if (clampedOverall >= 85) recommendation = "train";
  else if (clampedOverall >= 60) recommendation = "moderate";
  else recommendation = "rest";

  const generatedAt = new Date().toISOString();

  return {
    muscularScore: muscleOutput.muscularScore,
    muscleBreakdown: muscleOutput.muscleScores,
    cnsScore: cnsOutput.cnsScore,
    sleepScore: sleepOutput.sleepScore,
    sleepDebt: sleepOutput.cumulativeSleepDebtMinutes,
    stressScore: stressOutput.stressScore,
    overallScore: clampedOverall,
    recommendation,
    projectedFullRecovery: cnsOutput.projectedFullRecovery,
    overtrainingFlag: trendOutput.overtrainingFlag,
    deloadFlag: trendOutput.deloadFlag,
    generatedAt,
    recoveryModifier: sleepOutput.recoveryModifier,
  };
}
