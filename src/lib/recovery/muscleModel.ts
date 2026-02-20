/**
 * Muscle recovery model — exponential decay per muscle group
 * Evaluates last 14 days, sleep/stress modifiers, base recovery hours by size × RPE
 */

import type { WorkoutInput, MuscleGroup } from "./types";
import { MUSCLE_GROUPS } from "./types";
import { clamp, safeNumber, hoursBetween } from "./utils";

const MUSCLE_SIZE: Record<string, "small" | "medium" | "large"> = {
  chest: "medium",
  back: "large",
  shoulders: "medium",
  arms: "small",
  quads: "large",
  hamstrings: "medium",
  glutes: "large",
  calves: "small",
  core: "medium",
};

const BASE_RECOVERY_HOURS: Record<string, { light: number; moderate: number; heavy: number }> = {
  small: { light: 36, moderate: 48, heavy: 60 },
  medium: { light: 48, moderate: 60, heavy: 72 },
  large: { light: 60, moderate: 72, heavy: 96 },
};

const MAX_INITIAL_LOAD = 150;

function mapRPE(rpe: number): "light" | "moderate" | "heavy" {
  if (rpe <= 4) return "light";
  if (rpe <= 7) return "moderate";
  return "heavy";
}

function normalizeMuscleGroup(name: string): MuscleGroup {
  const lower = String(name ?? "").toLowerCase();
  const found = MUSCLE_GROUPS.find((g) => lower.includes(g) || g.includes(lower));
  return found ?? "core";
}

function getRecoveryHours(muscleGroup: string, rpe: number): number {
  const size = MUSCLE_SIZE[muscleGroup] ?? "medium";
  const intensity = mapRPE(rpe);
  return BASE_RECOVERY_HOURS[size][intensity];
}

/**
 * remainingFatigue = initialLoad * e^(-k * hoursElapsed)
 * k = ln(2) / halfLife. Never returns negative.
 */
function decayConstant(recoveryHours: number, sleepMod: number, stressMod: number, ageFactor: number): number {
  const safeHours = Math.max(1, safeNumber(recoveryHours, 48));
  const safeSleep = clamp(sleepMod, 0.8, 1.2);
  const safeStress = clamp(stressMod, 0.8, 1.1);
  const safeAge = Math.max(0.5, Math.min(1.5, safeNumber(ageFactor, 1)));
  const effectiveHours = safeHours * (1 / safeSleep) * (1 / safeStress) * (1 / safeAge);
  return Math.LN2 / Math.max(1, effectiveHours);
}

export interface MuscleModelOutput {
  muscleScores: Record<string, number>;
  muscularScore: number;
}

const LOOKBACK_DAYS = 14;

export function evaluateMuscleModel(
  workouts: WorkoutInput[],
  asOfDate: string,
  sleepModifier: number,
  stressModifier: number,
  ageFactor: number = 1
): MuscleModelOutput {
  const sleepMod = clamp(safeNumber(sleepModifier, 1), 0.8, 1.2);
  const stressMod = clamp(safeNumber(stressModifier, 1), 0.8, 1.1);
  const ageFac = safeNumber(ageFactor, 1);

  const asOf = new Date(asOfDate);
  if (Number.isNaN(asOf.getTime())) {
    return { muscleScores: Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, 100])), muscularScore: 100 };
  }
  const cutoff = new Date(asOf);
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);

  const fatigueByGroup: Record<string, number> = {};
  for (const g of MUSCLE_GROUPS) {
    fatigueByGroup[g] = 0;
  }

  const validWorkouts = Array.isArray(workouts) ? workouts : [];
  if (validWorkouts.length === 0) {
    const scores = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, 100]));
    return { muscleScores: scores, muscularScore: 100 };
  }

  for (const w of validWorkouts) {
    const workoutDate = new Date(w.workout_date);
    if (Number.isNaN(workoutDate.getTime())) continue;
    if (workoutDate > asOf) continue;

    if (workoutDate < cutoff) continue;

    const rpe = clamp(safeNumber(w.perceived_exertion, 6), 1, 10);
    const duration = Math.max(0, safeNumber(w.duration_minutes, 45));
    const rawLoad = (rpe / 10) * duration;
    const load = Math.min(MAX_INITIAL_LOAD, rawLoad);

    const groups = w.muscle_groups?.length
      ? w.muscle_groups.map((m) => normalizeMuscleGroup(m.muscle_group))
      : (["core"] as MuscleGroup[]);

    for (const g of groups) {
      const recoveryHours = getRecoveryHours(g, rpe);
      const k = decayConstant(recoveryHours, sleepMod, stressMod, ageFac);
      const hoursElapsed = hoursBetween(workoutDate, asOf);
      const decay = Math.exp(-k * hoursElapsed);
      const remainingFatigue = load * Math.max(0, decay);
      fatigueByGroup[g] = (fatigueByGroup[g] ?? 0) + remainingFatigue;
    }
  }

  const muscleScores: Record<string, number> = {};
  let sum = 0;
  let count = 0;
  const maxFatigue = 50;
  for (const g of MUSCLE_GROUPS) {
    const fatigue = Math.max(0, fatigueByGroup[g] ?? 0);
    const score = clamp(100 - (fatigue / maxFatigue) * 100, 0, 100);
    muscleScores[g] = Math.round(score);
    sum += score;
    count++;
  }
  const muscularScore = count > 0 ? Math.round(sum / count) : 100;
  return { muscleScores, muscularScore: clamp(muscularScore, 0, 100) };
}
