/**
 * Muscle recovery model
 * Sigmoid-based decay curve with volume, RPE, muscle group weighting
 */

import type { WorkoutInput, WorkoutExerciseInput, WorkoutMuscleGroupInput } from "./types";
import {
  MUSCLE_GROUP_WEIGHTS,
  INTENSITY_MULTIPLIERS,
  MUSCLE_RECOVERY_HALFLIFE_HOURS,
} from "./constants";

/**
 * Get muscle group weight (default 0.5 for unknown groups)
 */
function getMuscleWeight(group: string): number {
  const key = group.toLowerCase().replace(/\s+/g, "_");
  return MUSCLE_GROUP_WEIGHTS[key] ?? MUSCLE_GROUP_WEIGHTS.default;
}

/**
 * RPE intensity multiplier (1–10 scale)
 * Higher RPE = more fatigue, slower recovery
 */
function rpeIntensityMultiplier(rpe: number): number {
  // 1 → 0.2, 5 → 0.5, 10 → 1.2
  return 0.2 + (rpe / 10) * 1.0;
}

/**
 * Volume score = sets × reps × load factor
 */
function volumeScore(exercise: WorkoutExerciseInput): number {
  const sets = exercise.sets ?? 0;
  const reps = Array.isArray(exercise.reps_per_set)
    ? exercise.reps_per_set.reduce((a, b) => a + b, 0) / Math.max(1, exercise.reps_per_set.length)
    : 10;
  const load = exercise.weight_kg ?? 1;
  const loadFactor = Math.log10(load + 1) + 0.5;
  return sets * reps * loadFactor;
}

/**
 * Sigmoid-style recovery curve: 1 / (1 + exp(-k*(t - t_half)))
 * Returns recovery level 0–1 where 1 = fully recovered
 * t = hours since workout
 */
function sigmoidRecovery(hoursSince: number, halfLife: number): number {
  if (hoursSince <= 0) return 0;
  const k = 4 / halfLife; // Steepness
  const x = k * (hoursSince - halfLife);
  return 1 / (1 + Math.exp(-x));
}

/**
 * Calculate muscular recovery score (0–100)
 * Aggregates fatigue from all recent workouts with time decay
 */
export function calculateMuscleRecovery(
  workouts: WorkoutInput[],
  asOfDate: Date,
  sleepModifier: number,
  stressModifier: number
): number {
  if (workouts.length === 0) return 100;

  let totalFatigue = 0;
  let totalRecovery = 0;

  for (const workout of workouts) {
    const workoutDate = new Date(workout.workout_date);
    const hoursSince = (asOfDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60);

    const rpe = workout.perceived_exertion ?? 6;
    const rpeMult = rpeIntensityMultiplier(rpe);

    // Aggregate volume from exercises
    let workoutVolume = 0;
    if (workout.exercises?.length) {
      for (const ex of workout.exercises) {
        workoutVolume += volumeScore(ex);
      }
    } else {
      // Fallback: use duration as proxy
      const dur = workout.duration_minutes ?? 45;
      workoutVolume = dur * (rpe / 5);
    }

    // Muscle group weighting
    let muscleWeight = 0.5;
    if (workout.muscle_groups?.length) {
      const weights = workout.muscle_groups.map((mg) => {
        const w = getMuscleWeight(mg.muscle_group);
        const intensity = mg.intensity ? INTENSITY_MULTIPLIERS[mg.intensity] : 0.6;
        return w * intensity;
      });
      muscleWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
      if (workout.muscle_groups.length > 1) {
        muscleWeight = Math.min(1, muscleWeight * 1.2); // Compound workouts
      }
    }

    const fatigue = workoutVolume * rpeMult * muscleWeight;
    const recoveryFactor = sigmoidRecovery(hoursSince, MUSCLE_RECOVERY_HALFLIFE_HOURS);

    totalFatigue += fatigue * (1 - recoveryFactor);
  }

  // Normalize: assume "full fatigue" ≈ 500 arbitrary units → 0 score
  const normalizedFatigue = Math.min(1, totalFatigue / 500);
  const rawRecovery = (1 - normalizedFatigue) * sleepModifier * stressModifier;

  return Math.round(Math.min(100, Math.max(0, rawRecovery * 100)));
}
