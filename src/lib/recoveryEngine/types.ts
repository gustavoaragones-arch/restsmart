/**
 * Recovery Engine v1 — Input/Output types
 */

export interface WorkoutInput {
  id: string;
  workout_date: string;
  duration_minutes: number | null;
  perceived_exertion: number | null;
  name?: string | null;
  notes?: string | null;
  exercises?: WorkoutExerciseInput[];
  muscle_groups?: WorkoutMuscleGroupInput[];
}

export interface WorkoutExerciseInput {
  sets: number | null;
  reps_per_set: number[] | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  exercise_name: string;
}

export interface WorkoutMuscleGroupInput {
  muscle_group: string;
  intensity: "primary" | "secondary" | "tertiary" | null;
}

export interface SleepLogInput {
  sleep_date: string;
  total_minutes: number | null;
  quality: number | null;
  deep_sleep_minutes: number | null;
  rem_minutes: number | null;
  light_sleep_minutes: number | null;
  awakenings: number | null;
}

export interface StressLogInput {
  log_date: string;
  stress_level: number | null;
  hrv_ms: number | null;
  resting_hr: number | null;
}

export interface RecoveryEngineInput {
  userId: string;
  asOfDate: string; // ISO date string
  workouts: WorkoutInput[];
  sleepLogs: SleepLogInput[];
  stressLogs: StressLogInput[];
  recentHrvMs?: number | null;
  baselineHrvMs?: number | null;
}

export interface RecoveryScoreOutput {
  muscular_score: number;
  cns_score: number;
  sleep_score: number;
  stress_score: number;
  overall_score: number;
  recommendation: string;
  projected_full_recovery_timestamp: string | null;
  overtraining_flag: boolean;
  deload_flag: boolean;
  raw_data?: Record<string, unknown>;
}
